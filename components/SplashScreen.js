import React, { useEffect } from 'react';

const SplashScreen = ({ onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onComplete) {
        onComplete();
      }
    }, 2500); // 2.5 seconds

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="container">
      <div className="background-pulse" />
      <div className="background-pattern" />
      <div className="decorative-corner top-left" />
      <div className="decorative-corner top-right" />
      <div className="decorative-corner bottom-left" />
      <div className="decorative-corner bottom-right" />
      <div className="om-symbol">ॐ</div>
      <div className="compass-container">
        <div className="compass-outer">
          <div className="compass-outer-inner" />
          <div className="compass-inner">
            <div className="compass-directions">
              <div className="direction-label north-label">N</div>
              <div className="direction-label east-label">E</div>
              <div className="direction-label south-label">S</div>
              <div className="direction-label west-label">W</div>
            </div>
            <div className="compass-rose">
              <div className="compass-needle">
                <div className="needle-north" />
                <div className="needle-south" />
              </div>
              <div className="center-dot" />
            </div>
          </div>
        </div>
      </div>

      <div className="app-name">
        <h1>NiraVastuAI</h1>
        <div className="tagline">Vastu science from experts through AI</div>
      </div>

      <div className="loading-container">
        <div className="loading-dots">
          <div className="dot" />
          <div className="dot" />
          <div className="dot" />
        </div>
      </div>

      <style jsx>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .container {
          font-family: 'Georgia', serif;
          overflow: hidden;
          background: #FAFAF7; /* Porcelain */
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          width: 100%;
          position: relative;
        }

        .background-pulse {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 700px;
          height: 700px;
          background: radial-gradient(circle, rgba(244, 176, 0, 0.15) 0%, rgba(200, 138, 0, 0.08) 40%, transparent 70%);
          border-radius: 50%;
          animation: pulse-bg 3s ease-in-out infinite;
        }

        @keyframes pulse-bg {
          0%, 100% { 
            transform: translate(-50%, -50%) scale(1);
            opacity: 0.5;
          }
          50% { 
            transform: translate(-50%, -50%) scale(1.1);
            opacity: 0.8;
          }
        }

        .background-pattern {
          position: absolute;
          width: 100%;
          height: 100%;
          opacity: 0.05;
          background-image: 
            radial-gradient(circle at 20% 30%, rgba(244, 176, 0, 0.08) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(200, 138, 0, 0.05) 0%, transparent 50%),
            repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(233, 226, 214, .15) 35px, rgba(233, 226, 214, .15) 70px);
        }

        .compass-container {
          position: relative;
          width: 280px;
          height: 280px;
          animation: fadeInScale 1.2s ease-out;
        }

        @keyframes fadeInScale {
          0% {
            opacity: 0;
            transform: scale(0.5);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        .compass-outer {
          position: absolute;
          width: 100%;
          height: 100%;
          border: 2px solid #E9E2D6; /* Sand Line */
          border-radius: 50%;
          background: #FFFFFF; /* Warm White */
          box-shadow: 
            0 4px 16px rgba(0, 0, 0, 0.08),
            inset 0 0 20px rgba(233, 226, 214, 0.1);
        }

        .compass-outer-inner {
          position: absolute;
          top: 12px;
          left: 12px;
          right: 12px;
          bottom: 12px;
          border-radius: 50%;
          border: 1px solid #E9E2D6; /* Sand Line */
          box-shadow: 0 0 8px rgba(0, 0, 0, 0.05);
        }

        .compass-inner {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 220px;
          height: 220px;
          border-radius: 50%;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .compass-directions {
          position: absolute;
          width: 100%;
          height: 100%;
        }

        .direction-label {
          position: absolute;
          font-size: 20px;
          font-weight: 600;
          color: #1F2328; /* Charcoal */
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }

        .north-label {
          top: 10px;
          left: 50%;
          transform: translateX(-50%);
        }

        .east-label {
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
        }

        .south-label {
          bottom: 10px;
          left: 50%;
          transform: translateX(-50%);
        }

        .west-label {
          left: 10px;
          top: 50%;
          transform: translateY(-50%);
        }

        .compass-rose {
          position: relative;
          width: 160px;
          height: 160px;
          animation: rotateCompass 4s ease-in-out infinite;
        }

        @keyframes rotateCompass {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(90deg); }
          50% { transform: rotate(180deg); }
          75% { transform: rotate(270deg); }
        }

        .compass-needle {
          position: absolute;
          width: 8px;
          height: 140px;
          left: 50%;
          top: 50%;
          transform-origin: center center;
          transform: translate(-50%, -50%);
        }

        .needle-north {
          position: absolute;
          width: 0;
          height: 0;
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-bottom: 70px solid #F4B000; /* Saffron Gold */
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          filter: drop-shadow(0 2px 8px rgba(244, 176, 0, 0.4));
        }

        .needle-south {
          position: absolute;
          width: 0;
          height: 0;
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-top: 70px solid #3B2F2F; /* Espresso */
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          filter: drop-shadow(0 2px 4px rgba(59, 47, 47, 0.3));
        }

        .center-dot {
          position: absolute;
          width: 20px;
          height: 20px;
          background: radial-gradient(circle, #F4B000 0%, #C88A00 100%);
          border-radius: 50%;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          box-shadow: 0 0 16px rgba(244, 176, 0, 0.5);
          animation: glow 2s ease-in-out infinite;
          border: 2px solid rgba(255, 255, 255, 0.6);
        }

        @keyframes glow {
          0%, 100% { 
            box-shadow: 0 0 16px rgba(244, 176, 0, 0.5);
            transform: translate(-50%, -50%) scale(1);
          }
          50% { 
            box-shadow: 0 0 24px rgba(244, 176, 0, 0.7);
            transform: translate(-50%, -50%) scale(1.1);
          }
        }

        .app-name {
          margin-top: 60px;
          text-align: center;
          animation: fadeInUp 1.5s ease-out 0.5s both;
        }

        @keyframes fadeInUp {
          0% {
            opacity: 0;
            transform: translateY(30px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .app-name h1 {
          font-size: 48px;
          font-weight: 600;
          letter-spacing: 2px;
          color: #1F2328; /* Charcoal */
          margin-bottom: 10px;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }


        .app-name p {
          font-size: 16px;
          color: #6B7280; /* Slate */
          letter-spacing: 3px;
          font-weight: 400;
        }

        .tagline {
          margin-top: 20px;
          font-size: 14px;
          color: #6B7280; /* Slate */
          font-style: italic;
          animation: fadeInUp 1.5s ease-out 0.8s both;
        }

        .loading-container {
          position: absolute;
          bottom: 80px;
          animation: fadeInUp 1.5s ease-out 1s both;
        }

        .loading-dots {
          display: flex;
          gap: 8px;
          justify-content: center;
        }

        .dot {
          width: 8px;
          height: 8px;
          background: #F4B000; /* Saffron Gold */
          border-radius: 50%;
          animation: bounce 1.4s ease-in-out infinite;
          box-shadow: 0 0 8px rgba(244, 176, 0, 0.3);
        }

        .dot:nth-child(2) {
          animation-delay: 0.2s;
        }

        .dot:nth-child(3) {
          animation-delay: 0.4s;
        }

        @keyframes bounce {
          0%, 80%, 100% {
            transform: scale(0.8);
            opacity: 0.5;
          }
          40% {
            transform: scale(1.2);
            opacity: 1;
          }
        }

        .decorative-corner {
          position: absolute;
          width: 60px;
          height: 60px;
          border: 2px solid #E9E2D6; /* Sand Line */
        }

        .decorative-corner::before {
          content: '';
          position: absolute;
          width: 12px;
          height: 12px;
          background: #E9E2D6; /* Sand Line */
          border-radius: 50%;
        }

        .decorative-corner::after {
          content: '';
          position: absolute;
          width: 20px;
          height: 2px;
          background: linear-gradient(90deg, #E9E2D6, transparent);
        }

        .top-left {
          top: 30px;
          left: 30px;
          border-right: none;
          border-bottom: none;
        }

        .top-left::before {
          top: -6px;
          left: -6px;
        }

        .top-left::after {
          top: 8px;
          left: 8px;
        }

        .top-right {
          top: 30px;
          right: 30px;
          border-left: none;
          border-bottom: none;
        }

        .top-right::before {
          top: -6px;
          right: -6px;
        }

        .top-right::after {
          top: 8px;
          right: 8px;
          transform: rotate(180deg);
        }

        .bottom-left {
          bottom: 30px;
          left: 30px;
          border-right: none;
          border-top: none;
        }

        .bottom-left::before {
          bottom: -6px;
          left: -6px;
        }

        .bottom-left::after {
          bottom: 8px;
          left: 8px;
          transform: rotate(90deg);
        }

        .bottom-right {
          bottom: 30px;
          right: 30px;
          border-left: none;
          border-top: none;
        }

        .bottom-right::before {
          bottom: -6px;
          right: -6px;
        }

        .bottom-right::after {
          bottom: 8px;
          right: 8px;
          transform: rotate(-90deg);
        }

        .om-symbol {
          position: absolute;
          top: 40px;
          font-size: 32px;
          color: #6B7280; /* Slate */
          animation: fadeInUp 1.5s ease-out 1.2s both;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </div>
  );
};

export default SplashScreen;