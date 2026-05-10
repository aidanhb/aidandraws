interface Props {
  pdfPath: string;
}

export default function FlipbookPDF({ pdfPath: _pdfPath }: Props) {
  return (
    <div className="flex items-center justify-center py-16 px-6 bg-white/5 border border-dashed border-white/20 rounded">
      <p className="text-white/50 font-body text-sm">
        Flipbook viewer coming soon — will use react-pageflip + react-pdf
      </p>
    </div>
  );
}
