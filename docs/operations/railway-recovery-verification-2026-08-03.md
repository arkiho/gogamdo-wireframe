# Railway production recovery verification — 2026-08-03

## Verdict

**PASS for local logical backup and isolated restore.**

This proves that the canonical Railway MySQL logical dump and the application `/uploads` archive can be restored into isolated local destinations with exact schema/data/file integrity. Railway-native Volume backup schedules and initial snapshots were subsequently created on 2026-08-04, but native snapshot restore, PITR, and off-device disaster recovery remain unproven.

## Approved scope

- Read production metadata.
- Export the canonical MySQL database without modifying it.
- Download the application-owned `/uploads` path from the production Volume.
- Restore both artifacts locally into isolated disposable destinations.
- Do not deploy, migrate production data, change DNS, create GCP resources, or delete Railway services.

## Canonical topology confirmed

| Boundary | Confirmed source |
|---|---|
| Application service | `efficient-harmony` |
| Canonical database service | `MySQL` |
| Canonical database Volume | `mysql-volume` mounted at `/var/lib/mysql` |
| Application file Volume | `efficient-harmony-volume` mounted at `/data` |
| Application-owned file path | `/uploads` |

The application `DATABASE_URL` matched only the `MySQL` service. It did not match `MySQL-BBdA`, `MySQL-6jxl`, or `MySQL-wKlA`; those three services were not changed or deleted.

## Railway-native backup activation — 2026-08-04

The workspace was upgraded from Hobby to Pro after Railway's live Dashboard confirmed that Volume backups and PITR were unavailable on Hobby. The upgrade confirmation stated an immediate `$20` charge and the active Pro page confirmed `$20` of monthly usage credits. No payment-method details are retained in this report.

Both production Volumes now have the following schedules enabled:

| Schedule | Frequency shown by Railway | Retention shown by Railway |
|---|---|---|
| Daily | Every 24 hours | 6 days |
| Weekly | Every 7 days | 1 month |
| Monthly | Every 30 days | 3 months |

Initial Dashboard evidence:

| Service / Volume | Backup | Railway timestamp/status | Displayed size |
|---|---|---|---:|
| `MySQL` / `mysql-volume` | Manual | `2026-08-04 12:31` KST, created successfully | 183 MB |
| `efficient-harmony` / `efficient-harmony-volume` | Daily scheduled | Created immediately after schedule activation | 195 MB |
| `efficient-harmony` / `efficient-harmony-volume` | Manual | `2026-08-04 12:33` KST, created successfully | 195 MB |

The MySQL Dashboard showed the next scheduled backup in approximately five hours. The application Volume showed the next scheduled backup in approximately 23 hours. These relative times are Dashboard observations, not fixed contractual execution times.

Railway-native restore was intentionally **not** run against production. A restore can replace the attached Volume and trigger a redeploy, so the first native restore drill must use a disposable or isolated staging service. The native snapshots are same-provider convenience recovery and do not replace an encrypted backup outside the Railway workspace/account boundary.

## Backup set

Secure local directory:

```text
/Users/henrykihokim/Backups/gogamdo/20260803T054957Z
```

Directory mode is owner-only (`0700`); preserved files are owner-only (`0600`).

### Database artifact

| Metric | Result |
|---|---:|
| Server version | MySQL 9.4.0 |
| Base tables | 121 |
| Logical data + index bytes | 2,850,816 |
| Exact aggregate rows | 417 |
| Compressed dump bytes | 84,648 |
| Dump duration | 481.472 seconds |
| Completion marker verified | Yes |
| gzip full-read verification | Yes |
| SHA-256 recorded | Yes |

The dump used an online-consistent transaction and included schema, data, triggers, routines, events, binary-safe values, and UTF-8 settings. Credential values were used only in process memory and were not written to the report or command output.

### File artifact

| Metric | Result |
|---|---:|
| Files | 31 |
| Original bytes | 110,245,771 |
| Compressed archive bytes | 109,867,255 |
| Full per-file SHA-256 manifest | Yes |
| Symlinks accepted | No |
| SHA-256 recorded | Yes |

Filesystem internals such as `lost+found` were excluded. Only `/uploads` was archived.

## Isolated restore proof

### Database

The dump was imported into a new disposable local MySQL instance with TCP networking disabled.

| Verification | Result |
|---|---|
| Archive SHA-256 | Match |
| Tables | 121/121 match |
| Exact aggregate rows | 417/417 match |
| Exact per-table row counts | Full match |
| Column/type/nullability/default/collation fingerprint | Match |
| Index fingerprint | Match |
| Trigger/routine/event counts | Match |

### Files

The file archive was extracted into a fresh disposable directory with traversal and link rejection enabled.

| Verification | Result |
|---|---|
| Archive SHA-256 | Match |
| Files | 31/31 match |
| Bytes | 110,245,771/110,245,771 match |
| Full relative-path/size/SHA-256 manifest | Match |

### Measured local RTO

```text
14.639 seconds
```

This is the measured restore-and-verify duration on the local Mac for the current small dataset. It is not a guaranteed production RTO for GCP, Railway, or a future larger dataset.

## Recovery point and limitations

Source MySQL reported:

```text
log_bin: disabled
gtid_mode: OFF
```

Therefore:

- The verified recovery point is the logical export timestamp.
- Point-in-time recovery between exports is unavailable.
- The current worst-case data-loss window equals the interval between successful exports.
- Railway-native snapshots now exist, but native snapshot restore remains unproven and the current MySQL configuration still does not provide verified point-in-time recovery.
- The only verified recovery copy is currently on this Mac; it is not yet an independent off-device disaster-recovery copy.
- Database and Volume exports are separate operations and are not a cross-resource atomic snapshot.

## Artifact manifest

`backup-manifest.json` records:

- source scope without credentials or private identifiers;
- byte size and SHA-256 for each preserved artifact;
- isolated database and file restore results;
- measured restore duration;
- known limitations.

`files-manifest.json` contains customer-file relative paths and hashes and must remain private. Do not paste it into tickets, chat, or public repositories.

## Cleanup verified

- Duplicate raw downloaded `/uploads` tree removed after archive restore verification.
- Current restore disposable MySQL datadir removed after shutdown.
- Seven stale project-specific migration QA MySQL instances were targeted by exact project datadir, sent TERM, escalated to KILL when they remained alive, and verified absent; ports `43306`–`43312` were verified closed.
- Disposable extraction directory removed.
- Temporary audit/backup/restore scripts removed.
- Three non-canonical Railway MySQL services left unchanged.
- Railway production DB/files, deployment, DNS, and GCP left unchanged.

## Next gates

1. Monitor the first successful scheduled Daily/Weekly/Monthly runs and alert on missed runs.
2. Create an encrypted off-device copy with retention and deletion protection.
3. Rehearse restore from the off-device copy and from Railway native snapshots in isolated destinations, not production.
4. Establish native managed backup/PITR in the target Cloud SQL design.
5. Preserve Railway as rollback infrastructure until GCP staging, cutover, and rollback-window gates pass.
