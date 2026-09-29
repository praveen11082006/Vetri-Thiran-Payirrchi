# Script-Controlled ACL - Restrict Record Access Based on Field Value

ServiceNow lab: READ, CREATE, WRITE and DELETE ACLs on a custom table, where
access depends on the user's role and the record's `Branch` field.

## Structure
| Path | Purpose |
|---|---|
| `config/roles.json` | Roles bb1-bb4 and the EEEUser lab user |
| `config/table.json` | `u_institution_details` table and columns |
| `config/acls.json` | The four ACL definitions |
| `data/institution_details.csv` | Six sample student records |
| `src/acl/read_acl.script.js` | Advanced script for the READ ACL |
| `src/setup/acl_lab_setup.js` | One-shot background script that builds everything |
| `src/test/verify_access.js` | Background script that checks row visibility per user |

## Quick start
1. Log in as admin, elevate to `security_admin`.
2. Edit `TEMP_PASSWORD` in `src/setup/acl_lab_setup.js`.
3. Run it in **System Definition > Scripts - Background** (scope: Global).
4. Run `src/test/verify_access.js`, or impersonate EEEUser and open `u_institution_details_list.do`.

## ACL matrix
| Operation | Role | Data condition | Script |
|---|---|---|---|
| read | bb1 | Branch is EEE | yes |
| create | bb2 | none | no |
| write | bb3 | none | no |
| delete | bb4 | none | no |

## Expected results
- bb1 user: only EEE records (2)
- User without bb1: no records
- Admin: all 6 records (admin overrides + script)
- bb1+bb2: also sees New button; +bb3: can edit; +bb4: can delete

## Notes
- Use a PDI / sub-production instance.
- Manual build steps and screenshots are in the original lab PDF.
