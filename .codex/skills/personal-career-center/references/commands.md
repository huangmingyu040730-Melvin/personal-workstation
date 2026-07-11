# Career Center Commands

Use `"$HOME/.local/bin/workstation-cli"` below. Replace it with `npm run workstation --` when using a repo-level Skill Pack client.

## State And Lists

```bash
"$HOME/.local/bin/workstation-cli" career overview
"$HOME/.local/bin/workstation-cli" career item list --q "量化" --item-type experience --limit 10
"$HOME/.local/bin/workstation-cli" career version list --q "投研" --limit 10
"$HOME/.local/bin/workstation-cli" career jd list --status interview --limit 10
"$HOME/.local/bin/workstation-cli" career application list --q "company" --limit 10
```

Use `--json` when structured output is needed. Do not mix explanatory text into JSON output.

## Resume Item Payload

```json
{
  "item_type": "experience",
  "title": "量化研究实习",
  "organization": "示例机构",
  "role_title": "实习生",
  "location": "上海",
  "start_date": "2026-01-01",
  "end_date": "2026-03-31",
  "is_current": false,
  "summary": "仅填写真实经历。",
  "bullets": ["使用真实、可核验的职责与成果描述。"],
  "skills": ["Python"],
  "tags": ["量化研究"],
  "details": {},
  "sort_order": 0,
  "is_featured": false,
  "related_project_id": null,
  "related_publication_id": null,
  "related_knowledge_id": null,
  "related_skill_id": null
}
```

```bash
"$HOME/.local/bin/workstation-cli" career item create --data-file /tmp/resume-item.json
"$HOME/.local/bin/workstation-cli" career item show --id "ITEM_ID"
"$HOME/.local/bin/workstation-cli" career item update --id "ITEM_ID" --data-file /tmp/resume-item-update.json
```

Update files contain only changed fields.

## Resume Version Payload

```json
{
  "title": "量化研究岗位简历",
  "target_role": "量化研究实习",
  "summary": "面向量化研究岗位的私密版本。",
  "language": "zh",
  "template_key": "classic",
  "is_active": true,
  "is_featured": false,
  "notes": null,
  "profile_fields": {
    "show_name": true,
    "show_phone": true,
    "show_email": true
  },
  "section_order": ["education", "experience", "projects", "research", "skills", "certifications", "awards", "other"],
  "template_options": {
    "target_keywords": ["Python", "因子研究", "回测"]
  },
  "items": [
    {
      "resume_item_id": "ITEM_ID",
      "section_key": "experience",
      "sort_order": 0,
      "is_visible": true,
      "note": null,
      "visible_fields": {}
    }
  ]
}
```

```bash
"$HOME/.local/bin/workstation-cli" career version create --data-file /tmp/resume-version.json
"$HOME/.local/bin/workstation-cli" career version show --id "VERSION_ID"
"$HOME/.local/bin/workstation-cli" career version quality --id "VERSION_ID"
"$HOME/.local/bin/workstation-cli" career version preview --id "VERSION_ID" --json
"$HOME/.local/bin/workstation-cli" career version export --id "VERSION_ID" --output ./resume.docx
```

## JD Analysis And Application Status

```bash
"$HOME/.local/bin/workstation-cli" career jd analyze \
  --version-id "VERSION_ID" \
  --jd-file /tmp/job-description.txt \
  --company "公司名称" \
  --job-title "岗位名称" \
  --direction quant_research \
  --status reviewed

"$HOME/.local/bin/workstation-cli" career application update \
  --id "REVIEW_ID" \
  --status interview \
  --notes-file /tmp/application-note.txt
```

Analysis automatically saves a private JD review/application record. It does not update resume items or submit an application.

## Explicit Delete

```bash
"$HOME/.local/bin/workstation-cli" career item show --id "ITEM_ID"
"$HOME/.local/bin/workstation-cli" career item delete --id "ITEM_ID" --confirm-delete
```

The same pattern applies to `career version` and `career jd`. Deleting a resume version cascades its version-item links and JD reviews; require explicit user confirmation after showing that impact.
