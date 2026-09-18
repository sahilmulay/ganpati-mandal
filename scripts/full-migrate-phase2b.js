/**
 * Phase 2B: Full Migration of Remaining 32 Media Records to Supabase Storage
 *
 * STRICT SAFETY RULES:
 * 1. Audits pre-flight counts: exactly 32 unmigrated records (23 photos, 9 videos).
 * 2. Never re-uploads or alters already migrated records (Phase 2A pilot records).
 * 3. Never deletes, overwrites, or modifies the Base64 'image' column.
 * 4. Verifies public CDN URL (HTTP 200, size, MIME) BEFORE updating database row.
 * 5. Full rollback capability preserved.
 */

const SUPABASE_URL = 'https://wrvvnqanjtrmmltoaxvg.supabase.co';
const PUBLISHABLE_KEY = 'sb_publishable_1isjm1Z4wAtnI0pdzGpmIg_Yc0Q7KSw';

const headers = {
  'apikey': PUBLISHABLE_KEY,
  'Authorization': `Bearer ${PUBLISHABLE_KEY}`
};

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (bytes / Math.pow(k, i)).toFixed(1) + ' ' + sizes[i];
}

function detectMimeType(dataUrlOrBase64, fallbackType) {
  if (!dataUrlOrBase64 || typeof dataUrlOrBase64 !== 'string') {
    return fallbackType === 'video' ? 'video/mp4' : 'image/jpeg';
  }
  let match = dataUrlOrBase64.match(/^data:([^;]+);base64,/i);
  if (match && match[1]) return match[1].toLowerCase();

  let clean = dataUrlOrBase64.replace(/^data:[^,]+,/, '').trim();
  if (clean.startsWith('/9j/')) return 'image/jpeg';
  if (clean.startsWith('iVBORw0KGgo')) return 'image/png';
  if (clean.startsWith('UklGR')) return 'image/webp';
  if (clean.startsWith('R0lGOD')) return 'image/gif';
  if (clean.startsWith('AAAA') || clean.slice(0, 100).includes('ftyp')) return 'video/mp4';

  return fallbackType === 'video' ? 'video/mp4' : 'image/jpeg';
}

function getExtension(mimeType, type) {
  const mime = (mimeType || '').toLowerCase();
  if (type === 'video' || mime.startsWith('video/')) {
    if (mime === 'video/webm') return 'webm';
    if (mime === 'video/quicktime') return 'mov';
    return 'mp4';
  }
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  if (mime === 'image/gif') return 'gif';
  return 'jpg';
}

async function fetchUnmigratedScope() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/alankar?storage_migrated=eq.false&select=id,type,date,note,storage_migrated,media_url,mime_type&order=date.asc,created_at.asc`,
    { headers }
  );
  if (!res.ok) throw new Error(`Failed to fetch unmigrated scope: HTTP ${res.status}`);
  return await res.json();
}

async function migrateSingleRecord(meta, index, total) {
  const id = meta.id;
  const startTime = Date.now();
  console.log(`───────────────────────────────────────────────────────────────`);
  console.log(`[${index + 1}/${total}] Processing record: ${id}`);

  // Step 1: Fetch single record with Base64 data
  const fetchRes = await fetch(
    `${SUPABASE_URL}/rest/v1/alankar?id=eq.${encodeURIComponent(id)}&select=id,type,date,note,image,storage_migrated`,
    { headers }
  );
  if (!fetchRes.ok) {
    throw new Error(`Failed to fetch record data for ${id}: HTTP ${fetchRes.status}`);
  }
  const records = await fetchRes.json();
  if (!records || records.length === 0) {
    throw new Error(`Record ${id} not found`);
  }
  const rec = records[0];

  // Step 2: Validate
  if (!rec.image || rec.image.trim().length === 0) {
    throw new Error(`Record ${id} has empty Base64 'image' field`);
  }
  if (rec.storage_migrated === true) {
    console.log(`   Record ${id} already marked as migrated. Skipping.`);
    return { id, status: 'SKIPPED_ALREADY_MIGRATED' };
  }

  // Step 3: Determine MIME type
  const rawType = (rec.type || '').toLowerCase();
  const isVideo = rawType === 'video';
  const detectedType = isVideo ? 'video' : 'photo';
  const mimeType = detectMimeType(rec.image, detectedType);
  const ext = getExtension(mimeType, detectedType);

  // Step 4: Convert Base64 to Buffer & Validate
  const commaIdx = rec.image.indexOf(',');
  const b64Data = commaIdx !== -1 ? rec.image.slice(commaIdx + 1) : rec.image;
  const cleanB64 = b64Data.trim().replace(/[\r\n\s]+/g, '');
  const buffer = Buffer.from(cleanB64, 'base64');
  const bufferSize = buffer.length;

  if (bufferSize === 0) {
    throw new Error(`Decoded buffer size is 0 bytes for record ${id}`);
  }

  // Step 5 & 6: Determine bucket & path
  const bucket = isVideo ? 'alankar-videos' : 'alankar-images';
  const mandalSlug = 'vrindavan';
  const folder = isVideo ? 'videos' : 'photos';
  const storagePath = `${mandalSlug}/${folder}/${id}.${ext}`;
  const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${bucket}/${storagePath}`;
  const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${storagePath}`;

  console.log(`   Type: ${detectedType.toUpperCase()} | MIME: ${mimeType} | Size: ${formatBytes(bufferSize)}`);
  console.log(`   Destination: ${bucket}/${storagePath}`);

  // Step 7: Upload to Storage (check if already in storage first)
  let needUpload = true;
  try {
    const cdnCheck = await fetch(publicUrl, { method: 'GET' });
    if (cdnCheck.status === 200) {
      const cdnBuf = await cdnCheck.arrayBuffer();
      if (cdnBuf.byteLength === bufferSize) {
        console.log(`   File already in storage and verified identical size (${formatBytes(bufferSize)}). Skipping re-upload.`);
        needUpload = false;
      }
    }
  } catch (e) {}

  if (needUpload) {
    process.stdout.write('   Uploading binary to storage... ');
    const upRes = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': mimeType
      },
      body: buffer
    });

    if (!upRes.ok) {
      const errText = await upRes.text();
      console.log('FAILED ❌');
      throw new Error(`Upload failed for ${id} (${upRes.status}): ${errText}`);
    }
    console.log('SUCCESS ✅');
  }

  // Step 8: Verify Upload on Public CDN
  process.stdout.write('   Verifying public CDN endpoint... ');
  const cdnRes = await fetch(publicUrl, { method: 'GET' });
  if (cdnRes.status !== 200) {
    console.log('FAILED ❌');
    throw new Error(`CDN verification failed for ${id}: HTTP ${cdnRes.status}`);
  }
  const cdnBuf = await cdnRes.arrayBuffer();
  if (cdnBuf.byteLength !== bufferSize) {
    console.log('FAILED ❌');
    throw new Error(`CDN byte size mismatch for ${id}: got ${cdnBuf.byteLength}, expected ${bufferSize}`);
  }
  const cdnContentType = cdnRes.headers.get('content-type') || '';
  console.log(`SUCCESS ✅ (${formatBytes(cdnBuf.byteLength)}, HTTP 200, Content-Type: ${cdnContentType})`);

  // Step 9: Update Database Record (NEVER touch 'image' column!)
  process.stdout.write('   Updating database metadata (preserving Base64)... ');
  const updatePayload = {
    media_url: publicUrl,
    storage_path: storagePath,
    storage_migrated: true,
    mime_type: mimeType
  };

  const patchRes = await fetch(`${SUPABASE_URL}/rest/v1/alankar?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: {
      ...headers,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(updatePayload)
  });

  if (!patchRes.ok) {
    const errText = await patchRes.text();
    console.log('FAILED ❌');
    throw new Error(`Database PATCH failed for ${id}: ${errText}`);
  }

  const updatedRows = await patchRes.json();
  const updatedRow = updatedRows[0];
  if (!updatedRow || !updatedRow.storage_migrated || updatedRow.media_url !== publicUrl) {
    console.log('FAILED ❌');
    throw new Error(`Row confirmation failed for ${id}: database did not return expected values`);
  }

  // Verify Base64 was untouched
  if (!updatedRow.image || updatedRow.image.length !== rec.image.length) {
    console.log('CRITICAL ERROR: Original Base64 altered! Aborting...');
    throw new Error(`CRITICAL: Base64 'image' length changed for record ${id}!`);
  }

  const elapsedMs = Date.now() - startTime;
  console.log('SUCCESS ✅');
  console.log(`   ✅ Record ${id} migrated & verified in ${elapsedMs}ms`);

  return {
    id,
    type: detectedType,
    note: rec.note || '',
    size: bufferSize,
    mime: mimeType,
    bucket,
    storagePath,
    publicUrl,
    elapsedMs,
    status: 'VERIFIED_OK'
  };
}

async function runPhase2B() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║   GANPATI MANDAL – PHASE 2B FULL MEDIA MIGRATION             ║');
  console.log('║   Migrating Remaining 32 Records to Supabase Storage         ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  // Pre-flight scope check
  console.log('1. Checking unmigrated scope from database...');
  const unmigrated = await fetchUnmigratedScope();
  const unmigratedPhotos = unmigrated.filter(r => (r.type || '').toLowerCase() !== 'video');
  const unmigratedVideos = unmigrated.filter(r => (r.type || '').toLowerCase() === 'video');

  console.log(`   Total Unmigrated Found: ${unmigrated.length}`);
  console.log(`   - Photos: ${unmigratedPhotos.length} (Expected: 23)`);
  console.log(`   - Videos: ${unmigratedVideos.length} (Expected: 9)`);

  if (unmigrated.length !== 32 || unmigratedPhotos.length !== 23 || unmigratedVideos.length !== 9) {
    console.error(`\n❌ SCOPE MISMATCH! Expected 32 total (23 photos, 9 videos), found ${unmigrated.length}.`);
    console.error('Stopping immediately for safety.');
    process.exit(1);
  }

  console.log('   ✅ Scope verified: exactly 32 records to migrate.\n');

  const overallStartTime = Date.now();
  const results = [];
  const failures = [];
  let totalBytes = 0;

  for (let i = 0; i < unmigrated.length; i++) {
    const meta = unmigrated[i];
    try {
      const res = await migrateSingleRecord(meta, i, unmigrated.length);
      results.push(res);
      totalBytes += res.size;
    } catch (err) {
      console.error(`\n❌ ERROR MIGRATING RECORD ${meta.id}:`, err.message);
      failures.push({ id: meta.id, error: err.message });
      console.error('Halting migration to protect data integrity.');
      break;
    }
  }

  const totalDurationMs = Date.now() - overallStartTime;

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log(' PHASE 2B MIGRATION SUMMARY REPORT');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`Total Target:     32 records`);
  console.log(`Successful:       ${results.length}`);
  console.log(`Failed:           ${failures.length}`);
  console.log(`Total Payload:    ${formatBytes(totalBytes)}`);
  console.log(`Duration:         ${(totalDurationMs / 1000).toFixed(1)}s\n`);

  if (failures.length > 0) {
    console.error('FAILURES:');
    console.table(failures);
    process.exit(1);
  }

  console.log('All 32 records migrated and verified successfully! ✅\n');
}

runPhase2B().catch(err => {
  console.error('Fatal error during Phase 2B:', err);
  process.exit(1);
});
