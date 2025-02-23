import Microphone from "../../shared/components/PracticePronounce/Microphone";
import PronounceExample from "../../shared/components/PracticePronounce/PronounceExample";
import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import Button from "@mui/material/Button";
import usePronounceScoreStore from "../../shared/stores/pronounceScoreStore";
import FinishModal from "../../shared/components/PracticePronounce/FinishModal";
import { pronounceFinishPost } from "../../services/PronouncePractice/PronouncePracticePost";

function TrainPronounce() {
  const { options } = useParams();
  const [showModal, setShowModal] = useState<boolean>(false);
  const { setIsNumberZero } = usePronounceScoreStore();
  const navigate = useNavigate();

  const finishPost = async () => {
    try {
      const response = await pronounceFinishPost();
      void response; // 주석된 콘솔 출력 유지용. 빌드오류 방지용 코드로 역할 없음
      // console.log(response.data)
    } catch (_e) {
      // console.log(e)
    }
  };

  const closeModal = () => {
    setShowModal(false); // 모달 닫기
    setIsNumberZero();
    finishPost();
    navigate("/training");
  };

  const handleClick = () => {
    setShowModal(true);
  };

  return (
    <>
      <Button
        variant="outlined"
        sx={{
          color: "#FF8C82", 
          borderColor: "#FF8C82",
          fontSize: {
            sm: "1.125rem", // sm:text-lg
            md: "1.125rem", // md:text-lg
            lg: "1.25rem", // lg:text-xl
            xl: "1.5rem", // xl:text-2xl
          },
        }}
        style={{ marginLeft: "3%" }}
        onClick={handleClick}
        aria-label="연습 종료하기"
      >
        종료하기
      </Button>
      <main className="min-h-[70vh] flex justify-center">
        <div className="flex flex-col justify-center align-middle" role="region" aria-label="발음 연습 영역">
          <PronounceExample
            color={"#FF8C82"}
            size={3}
            trainingId={options === "sentence" ? 1 : 2}
          />
          <Microphone color={"#FF8C82"} size={5} />
        </div>
      </main>

      <FinishModal isOpen={showModal} onClose={closeModal} />
    </>
  );
}

export default TrainPronounce;
