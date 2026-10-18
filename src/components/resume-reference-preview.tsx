export function ResumeReferencePreview({ image, pdf }: { image: string; pdf: string }) {
  return (
    <div className="w-full">
      <div className="resume-reference-paper">
        {/* The embedded fonts and pagination come from the verified original PDF.
            The caller renders this only while the current Word content matches. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt="与当前简历内容一致的原版 PDF 排版预览" />
      </div>
      <a href={pdf} download="中文简历.pdf" className="resume-reference-download mt-4 inline-block text-sm font-semibold text-blue-700">下载此版 PDF</a>
    </div>
  );
}
