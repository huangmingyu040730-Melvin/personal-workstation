# 简历原版维护

## 当前标准

2026-10-18 用户进一步要求与提供的 Word 和 PDF 完全一致，包括全部内容和字体。此前泛化行样式、保留旧内容的方案已 superseded，该近似导出路径已移除。

当前原版使用 `20261018-reference-template.docx` 和 `20261018-reference-layout.json`。模板只替换源文件的文字槽位并脱敏私人信息，不重建表格、不统一字体字号、不清理原始行高和空段落。每条素材的私密 `_resume_source` 数据保存原始文字片段与字段绑定；导出时填回原槽位，因此原版初始内容能逐字节恢复 `word/document.xml`。原始 styles、numbering、fontTable、theme、settings、页眉页脚和照片均保持一致。

私密版本“中文简历原版 · 20261018”已导入完整内容：个人信息、2 条教育、3 条实习、1 个项目和4项技能。旧素材和旧版本保留。本地代码尚未发布，线上展示是否启用本模板以实际部署为准。

## 日常使用与复用

所有简历版本（包括历史 classic/compact/research 键）均默认使用同一原 Word 模板，无需原版导入标记。日常流程是“新建/更新素材 → 新建/编辑岗位版本 → 勾选素材及可见字段 → 导出 Word”。学校、专业、学位、学院、GPA、课程、荣誉、岗位、部门、工作成果、项目背景/方法/结果、研究产出、技能与工具、证书等可见内容来自共享模型，按原段落/run 样式填入；条目和要点可以持续增加。工具和技能开关分别生效，不截断第9项之后的内容。

普通素材沿用源文件对应段落及文字样式，新增条目取消样本正文行高、保持标题/岗位与首段的分页关系，内容自然续页。原版导入素材则在未修改时完整恢复原始 XML，不改原始行高和文字片段。私密 `_resume_source` 仅用于逐片段恢复原文件和核对原版 PDF，不是使用当前模板的前提。

## 原版素材维护

在“简历素材”中编辑“原版简历内容”字段、正文和日期。保留 Word 原始 run 格式；未变更的片段仍按原边界输出，修改文字填入相应文字片段。日期未改动时保留源文件的原始日期字符串，修改后按月份生成。月度日期在数据库中以当月首日编码，仅用于排序和表单，简历继续按原始月份显示。

同一素材可以被多个版本引用。更新后下次 Word 导出使用新内容，已导出文件作为历史快照保留。表单保存会保留服务端的原版样式资料、照片与版本配置，不把未呈现的字段开关自动设为关闭。版本编辑保留原来的章节顺序。

网页的原版排版预览来自用户提供的一页 PDF，字体和分页直接沿用原 PDF。仅当当前选材、文字、字段开关及照片与内容指纹一致时展示。内容改变时立即停用旧快照并提示导出 Word，避免把过期 PDF 当作新生成结果。当前没有云端 Word/PDF 排版引擎，不能声称编辑后会自动生成新的原版 PDF。

## 从新原版准备模板

```bash
python3 scripts/prepare-reference-resume.py \
  --docx "/absolute/path/reference.docx" \
  --pdf "/absolute/path/reference.pdf" \
  --preview-png "/private/temp/reference.png" \
  --private-output "/private/temp/import"
```

编译器只支持已核验的原始行结构；变化时先检查槽位映射。仓库只写入脱敏模板与无正文的布局索引。原始正文、照片、PDF 与预览图只进入受控的私密 Career 数据；禁止提交原 CV、真实导入 JSON 或原版照片。通过受控 Career CLI 先 list/show，再创建或更新并读回；不直连数据库，不打印私人内容和凭据。重复导入按 revision/source hash 和素材标签识别，先读回既有记录，避免重复创建。

```bash
node scripts/check-resume-template.mjs
RESUME_REFERENCE_INPUT="/private/temp/input.json" \
RESUME_REFERENCE_DOCX="/absolute/path/reference.docx" \
node scripts/check-resume-template.mjs
npm run lint
npm run build
```

验收分开检查：私密数据读回后的内容/样式/照片与原 Word 的一致性、同一排版引擎的逐页渲染差异、PDF 快照与当前内容的指纹匹配、更新文字和隐藏素材后的正确导出。构建 trace 必须包含原版 DOCX 和布局 JSON；预览页与两个导出入口都要包含所需资源。

本次同一 bundled LibreOffice 下源 Word 与生成 Word 都渲染为两页，逐页差异为零；用户提供的 PDF 为一页。Microsoft Word 本机 AppleEvent 导出超时，未声称完成 Word 引擎重新导出 PDF 的验收。未通过改变字体、行高或缩小页面强行复刻单页；原文件在不同排版引擎的分页差异需要保留说明。
