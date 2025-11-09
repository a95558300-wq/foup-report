import React, { useState, useEffect } from "react";
import "./App.css";

// ✅ 한글/영문 너비를 다르게 계산하는 함수 (App 함수 외부에 추가)
const getDisplayLength = (str) => {
  let length = 0;
  for (const char of str) {
    // 한글(가~힣)은 2, 나머지(영문, 숫자, 기호)는 1로 계산
    if (/[가-힣]/.test(char)) {
      length += 2;
    } else {
      length += 1;
    }
  }
  return length;
};
// ------------------------------------------------------------------

// ✅ 모달 컴포넌트
const LoadModal = ({ savedList, onClose, onSelect }) => {
  if (!savedList || savedList.length === 0) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3 style={{ borderBottom: "2px solid #ccc", paddingBottom: "10px" }}>
          📂 불러올 데이터 선택
        </h3>
        <div className="scroll-list">
          {savedList.map((item, index) => (
            <div
              key={index}
              className="list-item"
              onClick={() => onSelect(index)}
            >
              <span className="list-date">{item.timestamp}</span>
              {/* 사용자 이름은 독립 환경 유지를 위해 표시하지 않음 */}
            </div>
          ))}
        </div>
        <button onClick={onClose} className="modal-close-btn">
          닫기
        </button>
      </div>
    </div>
  );
};

function App() {
  // ✅ Kakao SDK 초기화
  useEffect(() => {
    if (window.Kakao) {
      if (!window.Kakao.isInitialized()) {
        window.Kakao.init("36f94767862cd12d895cdce64ead54cd");
        console.log("✅ Kakao SDK initialized");
      }
    } else {
      console.warn("⚠️ Kakao SDK not found");
    }
  }, []);

  const [username, setUsername] = useState("");
  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(today);
  const [busNumber, setBusNumber] = useState("1호차");
  const [shift, setShift] = useState("DAY");
  const [destination, setDestination] = useState("");
  const [trips, setTrips] = useState([
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
  ]);
  
  // ✅ 모달 상태 추가
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [savedUserList, setSavedUserList] = useState([]);


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

  const calculateLoadSum = (trip) =>
    trip.rows.reduce((sum, row) => sum + (parseInt(row.load || 0, 10) || 0), 0);
  const totalLoadSum = trips.reduce(
    (sum, trip) => sum + calculateLoadSum(trip),
    0
  );

  // ✅ 저장 시 현재 사용자 이름과 함께 기록
  const handleSave = () => {
    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      alert("⚠️ 사용자 이름을 입력해주세요.");
      return;
    }
    // 사용자별 독립된 키 사용
    const key = `foup_trips_${trimmedUsername}`;
    const savedList = JSON.parse(localStorage.getItem(key) || "[]");
    const timestamp = new Date().toLocaleString();
    
    // 저장되는 데이터에 현재 사용자 이름 추가
    savedList.push({ 
        timestamp, 
        username: trimmedUsername, // 사용자 이름 저장
        trips 
    });
    
    localStorage.setItem(key, JSON.stringify(savedList));
    alert(`✅ ${trimmedUsername}님의 ${timestamp} 데이터가 저장되었습니다.`);
  };

  // ✅ 선택 불러오기 기능 (모달 열기)
  const handleOpenLoadModal = () => {
    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      alert("⚠️ 사용자 이름을 입력해주세요.");
      return;
    }
    const key = `foup_trips_${trimmedUsername}`;
    const savedList = JSON.parse(localStorage.getItem(key) || "[]");
    
    if (savedList.length === 0) {
      alert("⚠️ 저장된 데이터가 없습니다.");
      return;
    }

    // 현재 사용자 데이터만 모달에 표시
    setSavedUserList(savedList); 
    setIsModalOpen(true);
  };

  // ✅ 모달에서 데이터 선택 처리
  const handleSelectData = (index) => {
    if (savedUserList[index]) {
        const selectedData = savedUserList[index];
        setTrips(selectedData.trips);
        alert(`📂 ${selectedData.timestamp} 데이터를 불러왔습니다.`);
        setIsModalOpen(false); // 모달 닫기
    }
  };


  const handleKakaoShare = () => {
    if (!window.Kakao || !window.Kakao.isInitialized()) {
      alert("⚠️ 카카오 SDK가 아직 준비되지 않았습니다.");
      return;
    }

    // ✅ r.place 필드의 목표 폭 설정 (한글 6글자, 영문 12글자까지 커버)
    const TARGET_WIDTH = 12; 

    // ✅ 수정: r.place에 가변적인 공백 처리 적용
    const message = `📋 FOUP 운행일지
날짜: ${date}
호차: ${busNumber}
근무시간: ${shift}
목적지: ${destination || "-"}

${trips
  .map(
    (trip) => {
        // 헤더는 영문 약자로 변경하여 정렬 유지
        const header = `${trip.id}회차    [LOAD , UNLOAD]`;
        
        const rowsFormatted = trip.rows
            .map(
                (r) => {
                    const placeText = r.place;
                    const currentLength = getDisplayLength(placeText);
                    
                    // 목표 길이와 현재 길이의 차이만큼 공백을 생성
                    const spaceNeeded = TARGET_WIDTH - currentLength;
                    // 공백은 영문/숫자 폭을 기준으로 계산하므로, Math.max(0, spaceNeeded)
                    const padding = " ".repeat(Math.max(0, spaceNeeded));
                    
                    // 가변 공백을 적용한 포맷
                    return `${placeText}${padding} : ${(r.load || " ").toString().padEnd(5, " ")} , ${(r.unload || " ").toString().padEnd(4, " ")}`;
                }
            )
            .join("\n");
            
        return `\n${header}\n${rowsFormatted}\n상차 합계: ${calculateLoadSum(trip)} EA`;
    }
  )
  .join("\n")}
총 상차 합계: ${totalLoadSum} EA
총 회차: ${trips.length}회`;

    window.Kakao.Share.sendDefault({
      objectType: "text",
      text: message,
      link: { mobileWebUrl: window.location.href, webUrl: window.location.href },
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

      {/* 사용자 이름 */}
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

      {/* 상단 입력 (날짜, 호차, 근무, 목적지) */}
      <div
        style={{
          display: "flex",
          justifyContent: "center", 
          gap: "15px", 
          marginBottom: "10px",
          flexWrap: "wrap", 
          alignItems: "center",
          padding: "0 5px"
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <label>날짜</label>
            <input 
              type="date" 
              value={date} 
              onChange={(e) => setDate(e.target.value)} 
              // ✅ 수정: 날짜 입력창 너비를 늘림 (130px)
              style={{ width: '170px' }} 
            />
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <label>호차</label>
            <select
              value={busNumber}
              onChange={(e) => setBusNumber(e.target.value)}
              style={{ width: '80px' }}
            >
              {Array.from({ length: 100 }, (_, i) => (
                <option key={i} value={`${i + 1}호차`}>
                  {i + 1}호차
                </option>
              ))}
            </select>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <label>근무</label>
            <select 
              value={shift} 
              onChange={(e) => setShift(e.target.value)}
              style={{ width: '70px' }}
            >
              <option value="DAY">DAY</option>
              <option value="SW">SW</option>
              <option value="GY">GY</option>
            </select>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <label>목적지</label>
            <select
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              style={{ width: '80px' }}
            >
              <option value="">선택</option>
              <option value="기흥">기흥</option>
              <option value="천안">천안</option>
            </select>
        </div>
      </div>

      {/* 회차별 테이블 */}
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
                      style={{ width: '60px', textAlign: 'center' }} 
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={row.load}
                      onChange={(e) =>
                        handleInputChange(trip.id, index, "load", e.target.value)
                      }
                      style={{ width: '45px', textAlign: 'center' }} 
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={row.unload}
                      onChange={(e) =>
                        handleInputChange(trip.id, index, "unload", e.target.value)
                      }
                      style={{ width: '45px', textAlign: 'center' }} 
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

          <p style={{ textAlign: "center", fontWeight: "bold" }}>
            상차 합계: {calculateLoadSum(trip)} EA
          </p>
        </div>
      ))}

      <h3 style={{ textAlign: "center" }}>총 상차 합계: {totalLoadSum} EA</h3>
      <h4 style={{ textAlign: "center" }}>총 회차: {trips.length}회</h4>

      <div style={{ textAlign: "center", marginTop: "10px" }}>
        <button onClick={handleAddTrip}>➕ 회차 추가</button>
        <button onClick={handleRemoveTrip} style={{ marginLeft: "10px" }}>
          ➖ 회차 삭제
        </button>
      </div>

      {/* ✅ 버튼 간격 조정 및 정렬 */}
      <div
        style={{
          textAlign: "center",
          marginTop: "30px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "15px", // 버튼 간격 증가
        }}
      >
        <button onClick={handleSave}>💾 저장</button>
        <button onClick={handleOpenLoadModal}>📂 선택 불러오기</button>
        <button
          onClick={handleKakaoShare}
          style={{
            backgroundColor: "#FEE500",
            border: "none",
            borderRadius: "10px",
            padding: "10px 20px",
            fontWeight: "bold",
            marginTop: "10px", // 카카오톡 버튼 상단 간격 추가
          }}
        >
          📤 카카오톡으로 공유
        </button>

        <p style={{ marginTop: "15px", fontWeight: "bold" }}>(주)진로지스</p>
        <p style={{ marginTop: "3px", fontSize: "14px", color: "#555" }}>
          앱 개발자: 최원석
        </p>
      </div>
      
      {/* ✅ 모달 렌더링 */}
      {isModalOpen && (
        <LoadModal
          savedList={savedUserList}
          onClose={() => setIsModalOpen(false)}
          onSelect={handleSelectData}
        />
      )}
    </div>
  );
}

export default App;