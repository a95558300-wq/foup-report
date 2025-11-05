// src/KakaoShareButton.js
import React, { useEffect } from "react";

const KakaoShareButton = () => {
  useEffect(() => {
    // Kakao SDK 스크립트를 동적으로 불러오기
    const script = document.createElement("script");
    script.src = "https://t1.kakaocdn.net/kakao_js_sdk/2.4.0/kakao.min.js";
    script.integrity = "sha384-mXUttMCFjoo+uC9CP4w/Y8Tu1Qdu9ZPQGoUXQn5F6q6BLYK7Zp1efSa8f0bSJo7+";
    script.crossOrigin = "anonymous";
    document.body.appendChild(script);

    script.onload = () => {
      if (!window.Kakao.isInitialized()) {
        window.Kakao.init("36f94767862cd12d895cdce64ead54cd"); // ? 여기에 본인 키를 넣은 것 맞아요
      }
    };
  }, []);

  // 버튼 클릭 시 실행되는 함수
  const shareToKakao = () => {
    if (!window.Kakao) return;
    window.Kakao.Share.sendDefault({
      objectType: "feed",
      content: {
        title: "FOUP Report",
        description: "반도체 생산 모니터링 리포트를 카카오톡으로 확인하세요!",
        imageUrl: "https://developers.kakao.com/assets/img/about/logos/kakaolink/kakaolink_btn_medium.png",
        link: {
          mobileWebUrl: "http://localhost:3000",
          webUrl: "http://localhost:3000",
        },
      },
      buttons: [
        {
          title: "웹에서 보기",
          link: {
            mobileWebUrl: "http://localhost:3000",
            webUrl: "http://localhost:3000",
          },
        },
      ],
    });
  };

  return (
    <button
      onClick={shareToKakao}
      style={{
        backgroundColor: "#FEE500",
        border: "none",
        borderRadius: "12px",
        padding: "10px 20px",
        fontSize: "16px",
        cursor: "pointer",
        fontWeight: "bold",
      }}
    >
      ?? 카카오톡으로 보내기
    </button>
  );
};

export default KakaoShareButton;
