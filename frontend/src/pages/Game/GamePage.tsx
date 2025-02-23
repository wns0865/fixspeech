import { useState, useEffect, useRef } from "react";
import FallingLetter from "./components/FallingLetter";
import { Button } from "@mui/material";
import FavoriteIcon from "@mui/icons-material/Favorite";
import { getGameList, getGameWords, postGameResult } from "../../services/Game/GameApi";
import { useNavigate } from "react-router-dom";
import "./Blink.css";
import { LiveAudioVisualizer } from "react-audio-visualize";
import MicNoneIcon from "@mui/icons-material/MicNone";
import MicIcon from "@mui/icons-material/Mic";

export default function Game() {
  const [letters, setLetters] = useState<{ id: number; letter: string; left: number }[]>([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(5);
  const [isGameOver, setIsGameOver] = useState(false);
  const [recognizedText, setRecognizedText] = useState("");
  const [beforeText, setBeforeText] = useState("버튼을 눌러 녹음하고 다시 눌러 제출하세요");
  const [isGameRunning, setIsGameRunning] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [stageList, setStageList] = useState<number[]>([]);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [stage, setStage] = useState<number>(1);
  const [words, setWords] = useState<string[]>([]);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const recognitionRef = useRef<any>(null);
  const navigate = useNavigate();
  const judgmentLineHeight = window.innerHeight * 0.58;

  // stageList 가져오기
  useEffect(() => {
    getGameList().then((res) => {
      const idList = res.data.map((item: any) => item?.id).filter((id: number) => id !== undefined);
      setStageList(idList);
    });
  }, []);

  const handleStageSelection = (selectedStage: number) => {
    setStage(selectedStage);
    getGameWords(selectedStage).then((res) => {
      setWords(res.data);
      setCountdown(3); // Start countdown
    });
  };

  useEffect(() => {
    if (countdown === null) return;
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setCountdown(null); // Clear countdown
      startGame(); // Start game when countdown finishes
    }
  }, [countdown]);

  const addLetter = () => {
    const newLetter = {
      id: Date.now(),
      letter: words[Math.floor(Math.random() * words.length)],
      left: Math.floor(Math.random() * (window.innerWidth - 100)),
    };
    setLetters((prev) => [...prev, newLetter]);
  };

  const removeLetter = (id: number, isMissed: boolean = false) => {
    setLetters((prev) => prev.filter((letter) => letter.id !== id));
    if (isMissed && lives > 0) {
      setLives((prev) => {
        const newLives = prev - 1;
        if (newLives <= 0) endGame();
        return newLives;
      });
    }
  };

  const endGame = () => {
    setIsGameOver(true);
    setIsGameRunning(false);
    stopRecording();
    setLetters([]);

    const playtime = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;

    postGameResult({ level: stage, playtime, correctNumber: score });
  };

  const initializeRecognition = () => {
    if (!("webkitSpeechRecognition" in window)) {
      alert("이 브라우저는 음성 인식을 지원하지 않습니다.");
      return null;
    }
    const recognition = new (window as any).webkitSpeechRecognition() as any;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "ko-KR";

    recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        let transcript = event.results[i][0].transcript.trim().toLowerCase();
        transcript = transcript.replace(/\s+/g, "");

        if (event.results[i].isFinal) {
          setRecognizedText(transcript);
          setBeforeText(transcript);
        }
      }
    };

    recognition.onend = () => {
      if (isRecording) recognition.start();
    };

    return recognition;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true }); // 오디오 스트림 가져오기
      const recorder = new MediaRecorder(stream); // MediaRecorder 초기화
      setMediaRecorder(recorder); // 상태에 저장
      recorder.start(); // 녹음 시작
      setIsRecording(true);

      recorder.onstop = () => {
        setMediaRecorder(null); // MediaRecorder를 초기화
        setIsRecording(false); // 녹음 상태 업데이트
      };
    } catch (err) {
      console.error("마이크 접근 실패:", err);
    }

    if (!recognitionRef.current) recognitionRef.current = initializeRecognition();
    if (!isRecording && recognitionRef.current) recognitionRef.current.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (recognitionRef.current) recognitionRef.current.stop();
    if (mediaRecorder) {
      mediaRecorder.stop(); // MediaRecorder 중지
      setIsRecording(false); // 녹음 상태 업데이트
    }
  };

  const startGame = () => {
    setScore(0);
    setLives(5);
    setLetters([]);
    setIsGameOver(false);
    setIsGameRunning(true);
    setStartTime(Date.now());
  };

  const handleMatchCheck = () => {
    if (!recognizedText) return;
    const matchingLetters = letters.filter((letter) => letter.letter.toLowerCase().normalize("NFC") === recognizedText);
    if (matchingLetters.length > 0) {
      const oldestLetter = matchingLetters.reduce((minLetter, currentLetter) =>
        currentLetter.id < minLetter.id ? currentLetter : minLetter
      );
      setScore((prevScore) => prevScore + 1);
      removeLetter(oldestLetter.id);
      setRecognizedText("");
    } else {
      setRecognizedText("");
    }
  };

  useEffect(() => {
    handleMatchCheck();
  }, [recognizedText]);

  useEffect(() => {
    if (!isGameRunning) return;
    const letterInterval = setInterval(addLetter, 2500);
    return () => clearInterval(letterInterval);
  }, [isGameRunning]);

  return (
    <div className="flex flex-col min-h-[70vh] justify-between" style={{ backgroundColor: "#2C2C2E" }}>
      <div className="flex flex-col min-h-[70vh]">
        <div className="flex flex-col justify-start p-4">
          <div className="flex">
            {Array.from({ length: lives }).map((_, index) => (
              <FavoriteIcon key={index} style={{ color: "red", margin: "0 5px" }} />
            ))}
          </div>
          <div className="text-colorFE6250 font-bold mt-2">Score: {score}</div>
        </div>

        <div className="flex-1 relative w-full overflow-hidden">
          <div
            style={{
              position: "absolute",
              top: `${judgmentLineHeight}px`,
              width: "100%",
              height: "2px",
              backgroundColor: "#FF5733",
            }}
          />

          {letters.map((letter) => (
            <FallingLetter
              key={letter.id}
              letter={letter.letter}
              left={letter.left}
              onRemove={() => removeLetter(letter.id, true)}
            />
          ))}

          {!isGameRunning && !isGameOver && (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center"
              style={{ pointerEvents: "none" }}
            >
              {countdown === null ? (
                <h1 className="text-8xl font-bold text-colorFE6250 cursor-pointer mb-4 animate-blink">START</h1>
              ) : (
                <h1 className="text-8xl font-bold text-colorFE6250 cursor-pointer mb-4 animate-blink">{countdown}</h1>
              )}
              {countdown === null && (
                <div className="flex flex-col items-center mt-4" style={{ pointerEvents: "auto", width: "100%" }}>
                  <div className="flex justify-between w-full max-w-md gap-2">
                    {stageList.map((stageId) => (
                      <Button
                        key={stageId}
                        variant="contained"
                        style={{
                          backgroundColor: "#FFAB01",
                          color: "white",
                          flex: "1",
                          fontWeight: "bold",
                          fontFamily: "inherit"
                          
                        }}
                        onClick={() => handleStageSelection(stageId)}
                      >
                        {stageId === 1 ? "Easy" : stageId === 2 ? "Normal" : "Hard"}
                      </Button>
                    ))}
                  </div>
                  <div className="flex justify-center w-full max-w-md mt-4">
                    <Button
                      variant="outlined"
                      style={{
                        backgroundColor: "black",
                        color: "white",
                        width: "100%",                    
                        fontWeight: "bold",
                        fontFamily: "inherit",
                        border: "2px solid #FFAB01",
                        boxShadow: "0 0 10px #FFAB01, 0 0 20px #FFAB01",
                        transition: "all 0.3s ease"
                      }}
                      onClick={() => navigate("/game/ranking")}
                    >
                      랭킹 보기
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {isGameOver && (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <h1 className="text-8xl font-bold text-colorFE6250 mb-4 text-center ">GAME OVER</h1>
              <div className="flex gap-4 mt-4 text-white">
                <Button variant="text" onClick={() => (window.location.href = "/")}>
                  <p className="text-colorFE6250 font-bold">나가기</p>
                </Button>
                <Button variant="text" color="error" onClick={startGame}>
                  <p className="text-colorFE6250 font-bold">다시하기</p>
                </Button>
                <Button variant="text" color="error" onClick={() => navigate("/game/ranking")}>
                  <p className="text-colorFE6250 font-bold">랭킹보기</p>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {isGameRunning && (
        <div
          className="flex flex-col items-center justify-center min-h-[10vh] gap-4"
          style={{ backgroundColor: "transparent" }}
        >
          <h2 className="text-white bg-opacity-0 p-2 rounded-md">{beforeText}</h2>

          <div
            style={{
              position: "relative",
              width: "300px",
              height: "100px",
              cursor: "pointer",
            }}
            onClick={() => (isRecording ? stopRecording() : startRecording())}
          >
            {isGameRunning && mediaRecorder && (
              <LiveAudioVisualizer
                mediaRecorder={mediaRecorder}
                width={300}
                height={100}
                barColor="#FE6250"
                gap={3}
                barWidth={5}
              />
            )}

            {isRecording ? (
              <MicIcon
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  color: "#FE6250",
                  fontSize: "3rem",
                  zIndex: 2,
                }}
              />
            ) : (
              <MicNoneIcon
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  color: "#CCCCCC",
                  fontSize: "3rem",
                  zIndex: 2,
                }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
