/**
 * Tiêu đề hiện từng dòng: mỗi dòng nằm trong một "mặt nạ" và trượt lên từ dưới (xem .mask-line trong styles.css).
 * Chạy khi khối cha có class "in" (dùng <Reveal variant="none">).
 */
export default function Lines({ lines }: { lines: string[] }) {
  return (
    <>
      {lines.map((text, i) => (
        <span className="mask-line" key={i}>
          <span style={{ transitionDelay: `${80 + i * 120}ms` }}>{text}</span>
        </span>
      ))}
    </>
  );
}
