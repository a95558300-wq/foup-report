import React, { useState, useEffect } from "react";
import "./App.css";

function App() {
  // ✅ 카카오 SDK 초기화
  useEffect(() => {
    if (window.Kakao) {
      if (!window.Kakao.isInitialized()) {
        window.Kakao.init("36f94767862cd12d895cdce64ead54cd"); // ✅ 원석님 JS 키
        console.log("✅ Kakao SDK initialized:", window.Kakao.isInitialized());
      } else {
        console.log("ℹ️ Kakao SDK already initialized");
      }
    } else {
      console.warn("⚠️ Kakao SDK not found on window. Check index.html script tag.");
    }
  }, []);

  // ✅ 사용자 이름
  const [username, setUsername] = useState("");

  // ✅ 기본 상태
  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(today);
  const [busNumber, setBusNumber] = useState("1호차");
  const [shift, setShift] = useState("DAY");
  const [destination, setDestination] = useState("");

  // ✅ 회차별 초기 데이터
  const defaultTrips = [
    {
      id: 1,
      rows: [
        { place: "P3", load: "", unload: "" },
        { place: "P2", load: "", unload: "" },
        { place: "P1", load: "", unload: "" },
        { place: "M1", load: "", unload: "" },
        { place: "U1", load: "", unload: "" },
        { place: "12/13L", load: "", unload: "" },
      ],
    },
    {
      id: 2,
      rows: [
        { place: "P3", load: "", unload: "" },
        { place: "P2", load: "", unload: "" },
        { place: "P1", load: "", unload: "" },
        { place: "M1", load: "", unload: "" },
        { place: "U1", load: "", unload: "" },
        { place: "12/13L", load: "", unload: "" },
      ],
    },
  ];

  const [trips, setTrips] = useState(defaultTrips);

  // ✅ 입력 변경
  const handleInputChange = (tripId, index, field, value) => {
    const updatedTrips = trips.map((trip) => {
      if (trip.id === tripId) {
        const newRows = [...trip.rows];
        newRows[index][field] = value;
        return { ...trip, rows: newRows };
      }
      return trip;
    });
    setTrips(updatedTrips);
  };

  // ✅ 줄 추가 / 삭제
  const handleAddRow = (tripId) => {
    setTrips((prev) =>
      prev.map((trip) =>
        trip.id === tripId
          ? { ...trip, rows: [...trip.rows, { place: "", load: "", unload: "" }] }
          : trip
      )
    );
  };

  const handleRemoveRow = (tripId) => {
    setTrips((prev) =>
      prev.map((trip) =>
        trip.id === tripId
          ? { ...trip, rows: trip.rows.slice(0, -1) }
          : trip
      )
    );
  };

  // ✅ 회차 전체 추가 / 삭제
  const handleAddTrip = () => {
    const newId = trips.length > 0 ? trips[trips.length - 1].id + 1 : 1;
    const newTrip = {
      id: newId,
      rows: [
        { place: "P3", load: "", unload: "" },
        { place: "P2", load: "", unload: "" },
        { place: "P1", load: "", unload: "" },
        { place: "M1", load: "", unload: "" },
        { place: "U1", load: "", unload: "" },
        { place: "12/13L", load: "", unload: "" },
      ],
    };
    setTrips((prev) => [...prev, newTrip]);
  };

  const handleRemoveTrip = () => {
    if (trips.length > 1) {
      setTrips((prev) => prev.slice(0, -1));
    }
  };

  // ✅ 합계 계산
  const calculateLoadSum = (trip) =>
    trip.rows.reduce((sum, row) => sum + (parseInt(row.load || 0, 10) || 0), 0);
  const totalLoadSum = trips.reduce(
    (sum, trip) => sum + calculateLoadSum(trip),
    0
  );

  // ✅ 사용자별 저장
  const handleSave = () => {
    if (!username.trim()) {
      alert("⚠️ 사용자 이름을 입력해주세요.");
      return;
    }
    localStorage.setItem(`foup_trips_${username}`, JSON.stringify(trips));
    alert(`✅ ${username}님의 데이터가 저장되었습니다.`);
  };

  const handleLoad = () => {
    if (!username.trim()) {
      alert("⚠️ 사용자 이름을 입력해주세요.");
      return;
    }
    const saved = localStorage.getItem(`foup_trips_${username}`);
    if (saved) {
      setTrips(JSON.parse(saved));
      alert(`📂 ${username}님의 데이터를 불러왔습니다.`);
    } else {
      alert("⚠️ 저장된 데이터가 없습니다.");
    }
  };

  // ✅ 카카오톡 공유
  const handleKakaoShare = () => {
    if (!window.Kakao || !window.Kakao.isInitialized()) {
      alert("⚠️ 카카오 SDK가 아직 준비되지 않았습니다.");
      return;
    }

    const message = `📋 FOUP 운행일지
날짜: ${date}
호차: ${busNumber}
근무시간: ${shift}
목적지: ${destination || "-"}

${trips
  .map(
    (trip) => `
${trip.id}회차     [상차    ,    하차]
${trip.rows
  .map(
    (r) =>
      `${r.place.padEnd(8, " ")} : ${(r.load || " ").toString().padEnd(4, " ")} , ${(r.unload || " ").toString().padEnd(4, " ")}`
  )
  .join("\n")}
상차 합계: ${calculateLoadSum(trip)} EA
`
  )
  .join("\n")}
총 상차 합계: ${totalLoadSum} EA
총 회차: ${trips.length}회`;

    window.Kakao.Share.sendDefault({
      objectType: "text",
      text: message,
      link: {
        mobileWebUrl: window.location.href,
        webUrl: window.location.href,
      },
    });
  };

  return (
    <div
      style={{
        maxWidth: "750px",
        margin: "0 auto",
        padding: "30px 20px",
        backgroundColor: "#fafafa",
        borderRadius: "12px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      }}
    >
      <h2 style={{ textAlign: "center", fontWeight: "bold" }}>📦 FOUP 운행일지</h2>

      {/* ✅ 사용자 이름 입력 */}
      <div style={{ textAlign: "center", marginBottom: "15px" }}>
        <input
          type="text"
          placeholder="사용자 이름을 입력하세요"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{
            padding: "6px",
            borderRadius: "6px",
            border: "1px solid #ccc",
            width: "60%",
          }}
        />
      </div>

      {/* 상단 입력 */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          justifyContent: "space-between",
          marginBottom: "10px",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <label style={{ fontWeight: "bold" }}>날짜</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={{ flex: "1", padding: "5px", minWidth: "120px" }}
        />

        <label style={{ fontWeight: "bold" }}>호차</label>
        <select
          value={busNumber}
          onChange={(e) => setBusNumber(e.target.value)}
          style={{ flex: "1", padding: "5px", minWidth: "100px" }}
        >
          {Array.from({ length: 100 }, (_, i) => (
            <option key={i} value={`${i + 1}호차`}>
              {i + 1}호차
            </option>
          ))}
        </select>

        <label style={{ fontWeight: "bold" }}>근무</label>
        <select
          value={shift}
          onChange={(e) => setShift(e.target.value)}
          style={{ flex: "1", padding: "5px", minWidth: "80px" }}
        >
          <option value="DAY">DAY</option>
          <option value="SW">SW</option>
          <option value="GY">GY</option>
        </select>

        <label style={{ fontWeight: "bold" }}>목적지</label>
        <select
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          style={{ flex: "1", padding: "5px", minWidth: "100px" }}
        >
          <option value="">선택</option>
          <option value="기흥">기흥</option>
          <option value="천안">천안</option>
        </select>
      </div>

      {/* 회차별 표 */}
      {trips.map((trip) => (
        <div
          key={trip.id}
          style={{
            marginBottom: "25px",
            padding: "10px",
            border: "1px solid #ccc",
            borderRadius: "10px",
            backgroundColor: "#fff",
          }}
        >
          <h3 style={{ textAlign: "center" }}>{trip.id}회차</h3>

          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              marginTop: "10px",
              textAlign: "center",
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "#f0f0f0" }}>
                <th>위치</th>
                <th>상차</th>
                <th>하차</th>
              </tr>
            </thead>
            <tbody>
              {trip.rows.map((row, index) => (
                <tr key={index}>
                  <td>
                    <input
                      type="text"
                      value={row.place}
                      onChange={(e) =>
                        handleInputChange(trip.id, index, "place", e.target.value)
                      }
                      style={{ width: "90%" }}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={row.load}
                      onChange={(e) =>
                        handleInputChange(trip.id, index, "load", e.target.value)
                      }
                      style={{ width: "90%" }}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={row.unload}
                      onChange={(e) =>
                        handleInputChange(trip.id, index, "unload", e.target.value)
                      }
                      style={{ width: "90%" }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ textAlign: "center", marginTop: "10px" }}>
            <button onClick={() => handleRemoveRow(trip.id)}> - </button>
            <button onClick={() => handleAddRow(trip.id)}> + </button>
          </div>

          <p
            style={{
              textAlign: "center",
              fontWeight: "bold",
              marginTop: "10px",
            }}
          >
            상차 합계: {calculateLoadSum(trip)} EA
          </p>
        </div>
      ))}

      {/* ✅ 총합 및 회차수 */}
      <h3 style={{ textAlign: "center", marginTop: "20px" }}>
        총 상차 합계: {totalLoadSum} EA
      </h3>
      <h4 style={{ textAlign: "center", color: "#333" }}>
        총 회차: {trips.length}회
      </h4>

      {/* ✅ 회차 전체 제어 */}
      <div style={{ textAlign: "center", marginTop: "10px" }}>
        <button onClick={handleAddTrip}>➕ 회차 추가</button>
        <button onClick={handleRemoveTrip} style={{ marginLeft: "10px" }}>
          ➖ 회차 삭제
        </button>
      </div>

      {/* ✅ 저장 / 불러오기 / 공유 */}
      <div style={{ textAlign: "center", marginTop: "20px" }}>
        <button onClick={handleSave}>💾 저장</button>
        <button onClick={handleLoad} style={{ marginLeft: "10px" }}>
          📂 불러오기
        </button>
        <button
          onClick={handleKakaoShare}
          style={{
            backgroundColor: "#FEE500",
            border: "none",
            borderRadius: "10px",
            padding: "10px 20px",
            marginLeft: "10px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          📤 카카오톡으로 공유
        </button>

        <p style={{ marginTop: "15px", fontWeight: "bold" }}>(주)진로지스</p>
        <p style={{ marginTop: "3px", fontSize: "14px", color: "#555" }}>
          앱 개발자: 최원석
        </p>
      </div>
    </div>
  );
}

export default App;
