/**
 * กราฟเรดาร์แบบวาดเองด้วย SVG
 *
 * เดิมใช้ RadarChart ของ recharts แต่หน้าที่มีกราฟแค่ตัวนี้ต้องโหลด recharts ทั้งก้อน
 * (ราว 420KB แยกเป็นสอง chunk) ซึ่งกิน CPU ช่วงเปิดหน้าจน TBT บนมือถือสูงเกิน 400ms
 * เรดาร์เป็นแค่รูปหลายเหลี่ยมที่คำนวณจุดจากมุม วาดเองได้โดยไม่ต้องพึ่งไลบรารี
 *
 * ไม่มี tooltip แบบ recharts เพราะเปอร์เซ็นต์แสดงไว้ใต้ชื่อหัวข้อรอบกราฟอยู่แล้ว
 * ส่วนชื่อเต็มที่ถูกตัด ใส่ไว้ใน <title> ให้เบราว์เซอร์แสดงเองตอนเอาเมาส์ชี้
 */

export interface RadarPoint {
    /** ชื่อหัวข้อเต็ม */
    name: string;
    /** ค่า 0-100 */
    value: number;
}

const W = 360;
const H = 288;
const CX = W / 2;
const CY = H / 2;
const R = 85;
const RINGS = 5;
const MAX_LABEL = 14;
const COLOR = "#22c55e";

/** จุดบนแกนที่ i จากทั้งหมด n แกน โดยเริ่มจากด้านบนแล้ววนตามเข็มนาฬิกา */
function point(i: number, n: number, r: number) {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2;
    return { x: CX + r * Math.cos(a), y: CY + r * Math.sin(a), cos: Math.cos(a), sin: Math.sin(a) };
}

const toPath = (pts: { x: number; y: number }[]) =>
    pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

export default function SimpleRadar({ data }: { data: RadarPoint[] }) {
    const n = data.length;
    if (n === 0) return null;

    const clamp = (v: number) => Math.max(0, Math.min(100, v));
    const valuePts = data.map((d, i) => point(i, n, (R * clamp(d.value)) / 100));

    return (
        <svg
            viewBox={`0 0 ${W} ${H}`}
            className="w-full h-full"
            role="img"
            aria-label={data.map((d) => `${d.name} ${d.value}%`).join(", ")}
        >
            {/* ตารางใยแมงมุม */}
            <g stroke="#e5e7eb" fill="none">
                {Array.from({ length: RINGS }, (_, k) => (
                    <polygon
                        key={k}
                        points={toPath(data.map((_, i) => point(i, n, (R * (k + 1)) / RINGS)))}
                    />
                ))}
                {data.map((_, i) => {
                    const p = point(i, n, R);
                    return <line key={i} x1={CX} y1={CY} x2={p.x} y2={p.y} />;
                })}
            </g>

            {/* พื้นที่คะแนน */}
            <polygon
                points={toPath(valuePts)}
                fill={COLOR}
                fillOpacity={0.25}
                stroke={COLOR}
                strokeWidth={1.5}
                strokeLinejoin="round"
            />

            {data.map((d, i) => {
                const p = valuePts[i];
                const l = point(i, n, R + 12);
                const anchor = l.cos > 0.1 ? "start" : l.cos < -0.1 ? "end" : "middle";
                // ป้ายด้านบนดันขึ้นไปทั้งสองบรรทัด ด้านล่างดันลง ด้านข้างจัดกึ่งกลาง
                const dy1 = l.sin < -0.1 ? -14 : l.sin > 0.1 ? 10 : -2;
                const label = d.name.length > MAX_LABEL ? d.name.substring(0, MAX_LABEL) + "…" : d.name;

                return (
                    <g key={i}>
                        <title>{`${d.name} ${d.value}%`}</title>
                        <circle cx={p.x} cy={p.y} r={3} fill={COLOR} />
                        <text x={l.x} y={l.y} textAnchor={anchor} fontSize={12}>
                            <tspan x={l.x} dy={dy1} fill="#6b7280">{label}</tspan>
                            <tspan x={l.x} dy={14} fill="#15803d" fontWeight={600}>{d.value}%</tspan>
                        </text>
                    </g>
                );
            })}
        </svg>
    );
}
