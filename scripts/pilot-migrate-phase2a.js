/**
 * Phase 2A: Controlled Pilot Migration Script (5 Photos + 2 Videos)
 *
 * STRICT SAFETY RULES:
 * 1. Preflight probe test runs first (upload 1 KB, verify HTTP 200, clean up).
 * 2. Only migrates the 7 pre-approved pilot records.
 * 3. Never deletes, overwrites, or modifies the Base64 'image' column.
 * 4. Verifies public CDN URL (HTTP 200) BEFORE updating database row.
 * 5. Instant rollback capability per record and globally.
 */

const SUPABASE_URL = 'https://wrvvnqanjtrmmltoaxvg.supabase.co';
const PUBLISHABLE_KEY = 'sb_publishable_1isjm1Z4wAtnI0pdzGpmIg_Yc0Q7KSw';

const PILOT_PHOTO_IDS = ['k1556640', 'k5571141', 'k708644', 'k7191125', 'k5899528'];
const PILOT_VIDEO_IDS = ['k1171348', 'k0503281'];
const PILOT_TARGET_IDS = [...PILOT_PHOTO_IDS, ...PILOT_VIDEO_IDS];

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

async function runPreflightProbe() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(' STEP 0: PRE-FLIGHT PROBE VALIDATION');
  console.log('═══════════════════════════════════════════════════════════════');
  const dummy1KB = Buffer.alloc(1024, 0x41);
  const bucket = 'alankar-images';
  const probePath = `vrindavan/photos/__probe_test_${Date.now()}__.jpg`;
  const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${bucket}/${probePath}`;
  const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${probePath}`;

  // 1. Upload temporary 1 KB file
  process.stdout.write('1. Testing temporary 1 KB upload to alankar-images... ');
  const upRes = await fetch(uploadUrl, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'image/jpeg' },
    body: dummy1KB
  });
  if (!upRes.ok) {
    const err = await upRes.text();
    console.log('FAILED ❌');
    throw new Error(`Probe upload failed (${upRes.status}): ${err}`);
  }
  console.log('SUCCESS ✅');

  // 2. Verify public CDN URL returns 200
  process.stdout.write('2. Verifying public CDN URL returns HTTP 200... ');
  const cdnRes = await fetch(publicUrl, { method: 'GET' });
  if (cdnRes.status !== 200) {
    console.log('FAILED ❌');
    throw new Error(`Probe CDN returned HTTP ${cdnRes.status}, expected 200`);
  }
  const cdnBuf = await cdnRes.arrayBuffer();
  if (cdnBuf.byteLength !== 1024) {
    console.log('FAILED ❌');
    throw new Error(`Probe CDN size mismatch: ${cdnBuf.byteLength} vs 1024`);
  }
  console.log(`SUCCESS ✅ (${cdnBuf.byteLength} bytes received)`);

  // 3. Cleanup attempt
  process.stdout.write('3. Cleaning up temporary test file... ');
  const delRes = await fetch(`${SUPABASE_URL}/storage/v1/object/${bucket}`, {
    method: 'DELETE',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ prefixes: [probePath] })
  });
  console.log('PROBE COMPLETED ✅');
  console.log('✅ PRE-FLIGHT CHECK PASSED: Storage upload & CDN verified ready.\n');
}

async function rollbackRecord(id) {
  console.log(`[ROLLBACK] Reverting record ${id} to Base64-only mode...`);
  const res = await fetch(`${SUPABASE_URL}/rest/v1/alankar?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { ...headers, 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
    body: JSON.stringify({
      storage_migrated: false,
      media_url: null,
      storage_path: null
    })
  });
  if (!res.ok) {
    console.error(`[ROLLBACK ERROR] Failed to rollback record ${id}:`, await res.text());
  } else {
    console.log(`[ROLLBACK OK] Record ${id} reverted successfully.`);
  }
}

async function rollbackAll() {
  console.log('=== ROLLING BACK ALL PILOT RECORDS ===');
  for (const id of PILOT_TARGET_IDS) {
    await rollbackRecord(id);
  }
  console.log('=== ROLLBACK COMPLETE ===');
}

async function migrateSingleRecord(id, index, total) {
  const startTime = Date.now();
  console.log(`───────────────────────────────────────────────────────────────`);
  console.log(`[${index + 1}/${total}] Processing record: ${id}`);

  // 1. Fetch record
  const fetchRes = await fetch(
    `${SUPABASE_URL}/rest/v1/alankar?id=eq.${encodeURIComponent(id)}&select=id,mandal_id,date,type,note,image,created_at,media_url,storage_migrated,storage_path,mime_type`,
    { headers }
  );
  if (!fetchRes.ok) {
    throw new Error(`Failed to fetch record ${id}: HTTP ${fetchRes.status}`);
  }
  const records = await fetchRes.json();
  if (!records || records.length === 0) {
    throw new Error(`Record ${id} not found in database`);
  }
  const rec = records[0];

  if (!rec.image || rec.image.trim().length < 10) {
    throw new Error(`Record ${id} has invalid or empty Base64 'image' field`);
  }

  const rawType = (rec.type || 'photo').toLowerCase();
  const isVideo = rawType === 'video' || PILOT_VIDEO_IDS.includes(id);
  const detectedType = isVideo ? 'video' : 'photo';
  const mimeType = detectMimeType(rec.image, detectedType);
  const ext = getExtension(mimeType, detectedType);
  const bucket = isVideo ? 'alankar-videos' : 'alankar-images';
  const mandalSlug = 'vrindavan';
  const folder = isVideo ? 'videos' : 'photos';
  const storagePath = `${mandalSlug}/${folder}/${id}.${ext}`;
  const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${bucket}/${storagePath}`;
  const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${storagePath}`;

  // 2. Decode Base64 to Buffer
  const commaIdx = rec.image.indexOf(',');
  const b64Data = commaIdx !== -1 ? rec.image.slice(commaIdx + 1) : rec.image;
  const cleanB64 = b64Data.trim().replace(/[\r\n\s]+/g, '');
  const buffer = Buffer.from(cleanB64, 'base64');
  const bufferSize = buffer.length;

  console.log(`   Type: ${detectedType.toUpperCase()} | MIME: ${mimeType} | Size: ${formatBytes(bufferSize)}`);
  console.log(`   Target: ${bucket}/${storagePath}`);

  // 3. Upload to Supabase Storage (if not already uploaded and verified)
  let needUpload = true;
  try {
    const checkRes = await fetch(publicUrl, { method: 'GET' });
    if (checkRes.status === 200) {
      const checkBuf = await checkRes.arrayBuffer();
      if (checkBuf.byteLength === bufferSize) {
        console.log(`   File already in storage (${formatBytes(bufferSize)}) and verified valid. Skipping upload.`);
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

  // 4. Verify Public CDN URL via GET request
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
  console.log(`SUCCESS ✅ (${formatBytes(cdnBuf.byteLength)}, HTTP 200)`);

  // 5. Update Database Record (DO NOT TOUCH 'image' COLUMN!)
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
    console.error(`Database update failed for ${id}:`, errText);
    await rollbackRecord(id);
    throw new Error(`Database PATCH failed for ${id}: ${errText}`);
  }

  const updatedRows = await patchRes.json();
  const updatedRow = updatedRows[0];
  if (!updatedRow || !updatedRow.storage_migrated || updatedRow.media_url !== publicUrl) {
    console.log('FAILED ❌');
    await rollbackRecord(id);
    throw new Error(`Row verification failed for ${id}: update not confirmed`);
  }

  // Confirm original 'image' column was preserved
  if (!updatedRow.image || updatedRow.image.length !== rec.image.length) {
    console.log('CRITICAL ERROR: Original Base64 was altered! Reverting...');
    await rollbackRecord(id);
    throw new Error(`CRITICAL: Base64 'image' length changed from ${rec.image.length} to ${updatedRow.image?.length}`);
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

async function runMigration() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║   GANPATI MANDAL – PHASE 2A CONTROLLED PILOT MIGRATION       ║');
  console.log('║   Target: 5 Photos + 2 Videos (Total: 7 Records)             ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  // Step 0: Pre-flight probe
  await runPreflightProbe();

  // Safety confirmation
  console.log('Approved Pilot Target Scope:');
  console.log(`- Photos (${PILOT_PHOTO_IDS.length}): ${PILOT_PHOTO_IDS.join(', ')}`);
  console.log(`- Videos (${PILOT_VIDEO_IDS.length}): ${PILOT_VIDEO_IDS.join(', ')}`);
  console.log(`- Total Records: ${PILOT_TARGET_IDS.length}\n`);

  const results = [];
  let totalBytes = 0;

  for (let i = 0; i < PILOT_TARGET_IDS.length; i++) {
    const id = PILOT_TARGET_IDS[i];
    try {
      const res = await migrateSingleRecord(id, i, PILOT_TARGET_IDS.length);
      results.push(res);
      totalBytes += res.size;
    } catch (err) {
      console.error(`\n❌ ERROR MIGRATING RECORD ${id}:`, err.message);
      console.error('Migration aborted immediately to protect data integrity.');
      process.exit(1);
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log(' PILOT MIGRATION SUMMARY REPORT');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`Status: 7 of 7 records successfully migrated and verified.\n`);

  console.table(results.map(r => ({
    ID: r.id,
    Type: r.type,
    Size: formatBytes(r.size),
    MIME: r.mime,
    Bucket: r.bucket,
    Time: `${r.elapsedMs}ms`,
    Status: r.status
  })));

  console.log(`\nTotal transferred: ${formatBytes(totalBytes)}`);
  console.log(`Original Base64 image column: 100% UNTOUCHED (Rollback Source of Truth)`);
  console.log(`\nNext Steps:`);
  console.log(`1. Test public portal gallery playback & zoom on migrated items.`);
  console.log(`2. Verify Admin Dashboard shows 7 Migrated, 32 Remaining.`);
  console.log(`3. Await user confirmation before Phase 2B.\n`);
}

// CLI argument handling
const arg = process.argv[2];
if (arg === '--rollback-all') {
  rollbackAll().catch(err => { console.error('Rollback error:', err); process.exit(1); });
} else if (arg === '--rollback' && process.argv[3]) {
  rollbackRecord(process.argv[3]).catch(err => { console.error('Rollback error:', err); process.exit(1); });
} else {
  runMigration().catch(err => {
    console.error('Pilot migration fatal error:', err);
    process.exit(1);
  });
}
