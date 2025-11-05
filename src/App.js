import React, { useEffect, useState } from "react";

/**
 * FOUP Report - single-destination, in-only totals, editable fields
 * Kakao JS key included (your key). Fields can be added/removed/renamed.
 */

const DEFAULT_FIELDS = ["P3", "P2", "P1", "M1", "U1", "12/13L"];
const KAKAO_JS_KEY = "36f94767862cd12d895cdce64ead54cd"; // 이미 제공해주신 키

function App() {
  const [date, setDate] = useState(() => new Date().toISOString().substring(0, 10));
  const [carNumber, setCarNumber] = useState(8);
  const [shift, setShift] = useState("DAY");
  const [rounds, setRounds] = useState(2); // 기본 2회차
  const [fields, setFields] = useState(DEFAULT_FIELDS);
  const [destination, setDestination] = useState(""); // <-- 단일 목적지 (상단)

  // 레코드 생성 함수 (fields 기준으로 비어있는 레코드 생성)
  const makeEmptyRecord = () => {
    const rec = { total: 0 }; // total은 상차(in)만 합산
    fields.forEach((f) => (rec[f] = ["", ""])); // [in, out]
    return rec;
  };

  const [records, setRecords] = useState(() =>
    Array.from({ length: rounds }, () => makeEmptyRecord())
  );

  // 카카오 SDK 로드 및 초기화
  useEffect(() => {
    const existing = document.getElementById("kakao-sdk");
    if (!existing) {
      const script = document.createElement("script");
      script.id = "kakao-sdk";
      script.src = "https://t1.kakaocdn.net/kakao_js_sdk/2.5.0/kakao.min.js";
      script.async = true;
      script.onload = () => {
        if (window.Kakao && !window.Kakao.isInitialized()) {
          window.Kakao.init(KAKAO_JS_KEY);
          console.log("Kakao initialized");
        }
      };
      document.body.appendChild(script);
    } else {
      if (window.Kakao && !window.Kakao.isInitialized()) {
        window.Kakao.init(KAKAO_JS_KEY);
      }
    }
  }, []);

  // fields 변경 시 기존 records 보정 (필드 추가/삭제 시 안전하게 처리)
  useEffect(() => {
    setRecords((prev) =>
      prev.map((rec) => {
        const newRec = { total: 0 };
        fields.forEach((f) => {
          newRec[f] = rec[f] ? [...rec[f]] : ["", ""];
        });
        newRec.total = calculateTotal(newRec);
        return newRec;
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fields]);

  // rounds 변경 (1~4)
  const handleRoundsChange = (num) => {
    const newRounds = Math.min(Math.max(1, num), 4);
    setRounds(newRounds);
    setRecords((prev) => {
      const copy = prev.slice(0, newRounds);
      while (copy.length < newRounds) copy.push(makeEmptyRecord());
      return copy;
    });
  };

  // 합계 계산 — **상차(in)** 값만 합산
  const calculateTotal = (record) => {
    let sum = 0;
    fields.forEach((f) => {
      const pair = record[f];
      if (!pair) return;
      const inVal = Number(pair[0]);
      if (!isNaN(inVal) && pair[0] !== "") sum += inVal;
    });
    return sum;
  };

  // 입력 변경 (상차/하차)
  const handleInputChange = (roundIndex, field, sideIndex, value) => {
    setRecords((prev) => {
      const copy = prev.map((r) => ({ ...r }));
      const arr = copy[roundIndex][field] ? [...copy[roundIndex][field]] : ["", ""];
      arr[sideIndex] = value === "" ? "" : value;
      copy[roundIndex][field] = arr;
      copy[roundIndex].total = calculateTotal(copy[roundIndex]);
      return copy;
    });
  };

  // 필드 추가/삭제/이름 변경
  const addField = () => {
    let base = "NEW";
    let idx = 1;
    while (fields.includes(`${base}${idx}`)) idx++;
    setFields((prev) => [...prev, `${base}${idx}`]);
  };
  const removeField = (index) => {
    if (fields.length <= 1) {
      alert("위치는 최소 1개 이상이어야 합니다.");
      return;
    }
    setFields((prev) => prev.filter((_, i) => i !== index));
  };

  // totalAll (모든 회차의 상차 합)
  const totalAll = records.reduce((acc, r) => acc + (r.total || 0), 0);

  // 카카오 공유 (단일 목적지 사용)
  const shareToKakao = () => {
    if (!window.Kakao || !window.Kakao.Share) {
      alert("카카오 SDK가 아직 준비되지 않았습니다. 잠시 후 시도하세요.");
      return;
    }

    const lines = [];
    lines.push(`날짜: ${date}`);
    lines.push(`${carNumber}호차 (${shift})`);
    lines.push(`목적지: ${destination || "-"}`);
    lines.push(`운행 회수: ${rounds}회`);
    lines.push("");

    records.forEach((rec, idx) => {
      lines.push(`${idx + 1}회차`);
      fields.forEach((f) => {
        const pair = rec[f] || ["", ""];
        const inStr = pair[0] === "" ? "-" : String(pair[0]).padStart(2, "0");
        const outStr = pair[1] === "" ? "-" : String(pair[1]).padStart(2, "0");
        lines.push(`  ${f}: 상차 ${inStr} / 하차 ${outStr}`);
      });
      lines.push(`  상차 합계: ${rec.total} EA`);
      lines.push("");
    });

    lines.push(`총 상차 합계: ${totalAll} EA`);
    const message = lines.join("\n");

    try {
      window.Kakao.Share.sendDefault({
        objectType: "text",
        text: message,
        link: {
          mobileWebUrl: window.location.href,
          webUrl: window.location.href,
        },
      });
    } catch (e) {
      console.error(e);
      alert("카카오 공유 중 오류가 발생했습니다. 콘솔을 확인하세요.");
    }
  };

  // UI 렌더
  return (
    <div style={styles.container}>
      <h1 style={{ textAlign: "center" }}>🚌 FOUP Report (상차 합계)</h1>

      <div style={styles.topRow}>
        <div>
          <label>날짜: </label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>

        <div>
          <label>호차: </label>
          <select value={carNumber} onChange={(e) => setCarNumber(Number(e.target.value))}>
            {Array.from({ length: 50 }).map((_, i) => (
              <option key={i + 1} value={i + 1}>
                {i + 1}호차
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>운행 시간대: </label>
          <select value={shift} onChange={(e) => setShift(e.target.value)}>
            <option value="DAY">DAY</option>
            <option value="SW">SW</option>
            <option value="GY">GY</option>
          </select>
        </div>

        <div>
          <label>회차: </label>
          <input
            type="number"
            min="1"
            max="4"
            value={rounds}
            onChange={(e) => handleRoundsChange(Number(e.target.value))}
            style={{ width: 70 }}
          />
        </div>
      </div>

      <div style={styles.destinationRow}>
        <label>목적지(전체): </label>
        <input
          type="text"
          placeholder="전체 목적지 입력 (회차별 목적지 아님)"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          style={{ width: 300 }}
        />
      </div>

      <div style={styles.fieldsBox}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
          <strong>위치(칸) 관리</strong>
          <button onClick={addField} style={styles.smallBtn}>
            ＋ 칸 추가
          </button>
        </div>

        <div style={styles.fieldList}>
          {fields.map((f, idx) => (
            <div key={f} style={styles.fieldRow}>
              <input
                value={f}
                onChange={(e) => setFields((prev) => prev.map((p, i) => (i === idx ? e.target.value : p)))}
                style={{ width: 120 }}
              />
              <button onClick={() => removeField(idx)} style={styles.smallBtn}>
                −
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 회차별 폼 */}
      <div>
        {records.map((rec, idx) => (
          <div key={idx} style={styles.roundBox}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0 }}>{idx + 1}회차 FOUP</h3>
            </div>

            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left" }}>위치</th>
                  <th>상차</th>
                  <th>하차</th>
                </tr>
              </thead>
              <tbody>
                {fields.map((f) => (
                  <tr key={f}>
                    <td>{f}</td>
                    <td>
                      <input
                        type="number"
                        value={rec[f] ? rec[f][0] : ""}
                        onChange={(e) => handleInputChange(idx, f, 0, e.target.value)}
                        style={{ width: 80 }}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={rec[f] ? rec[f][1] : ""}
                        onChange={(e) => handleInputChange(idx, f, 1, e.target.value)}
                        style={{ width: 80 }}
                      />
                    </td>
                  </tr>
                ))}
                <tr>
                  <td style={{ textAlign: "right", fontWeight: "bold" }}>상차 합계:</td>
                  <td colSpan={2} style={{ fontWeight: "bold" }}>
                    {rec.total} EA
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        ))}
      </div>

      <div style={styles.summary}>
        <div>총 상차 합계: <strong>{totalAll}</strong> EA</div>

        <div style={{ marginTop: 12 }}>
          <button onClick={shareToKakao} style={styles.kakaoButton}>
            🟡 카카오톡으로 보내기
          </button>
        </div>
      </div>
    </div>
  );
}

// 스타일
const styles = {
  container: { fontFamily: "Arial, sans-serif", padding: 16, maxWidth: 920, margin: "0 auto" },
  topRow: { display: "flex", gap: 20, alignItems: "center", marginBottom: 12, flexWrap: "wrap" },
  destinationRow: { marginBottom: 12 },
  fieldsBox: { background: "#fff", padding: 12, borderRadius: 8, marginBottom: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" },
  fieldList: { display: "flex", gap: 10, flexWrap: "wrap" },
  fieldRow: { display: "flex", gap: 6, alignItems: "center" },
  smallBtn: { padding: "4px 8px", borderRadius: 6, cursor: "pointer" },
  roundBox: { background: "#ffffff", padding: 12, borderRadius: 8, marginBottom: 12, boxShadow: "0 2px 6px rgba(0,0,0,0.04)" },
  table: { width: "100%", borderCollapse: "collapse", marginTop: 8 },
  summary: { marginTop: 12, textAlign: "center" },
  kakaoButton: { background: "#FEE500", border: "none", padding: "10px 16px", borderRadius: 8, cursor: "pointer", fontWeight: "bold" },
};

export default App;
