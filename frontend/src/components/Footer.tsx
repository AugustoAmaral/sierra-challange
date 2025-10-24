function Footer({
  filesLength,
  filteredSize,
  totalSize,
}: {
  filesLength?: number;
  filteredSize?: string | null;
  totalSize?: string;
}) {
  totalSize = totalSize || "0 B";
  filesLength = filesLength || 0;

  const plural = filesLength !== 1 ? "s" : "";
  return (
    <div className="text-center text-sm text-slate-500">
      {filteredSize ? (
        <>
          {filesLength} resultado{plural} ({filteredSize}){" · "}
          Total: {filesLength} arquivo{plural} ({totalSize})
        </>
      ) : (
        <>
          Total de arquivos: {filesLength} · Espaço usado: {totalSize}
        </>
      )}
    </div>
  );
}
export default Footer;
