import type { NextPage } from "next";
import Head from "next/head";
import { useLocalization } from "../hooks/useLocalization";
import dynamic from "next/dynamic";
import LeftSide from "../components/LeftSide";
import { AppContext } from "../context";
import { useContext, useEffect, useState } from "react";
import NavBar from "../components/NavBar";
import DialerPopup from "../components/dialer-popup";

const ChatUiWindow = dynamic(
  () => import("../components/ChatWindow/ChatUiWindow"),
  { ssr: false }
);

const Home: NextPage = () => {
  const t = useLocalization();
  const context = useContext(AppContext);

  return (
    <>
      <Head>
        <title> {t("label.title")}</title>
      </Head>
      {context?.showDialerPopup && (
        <div>
          {/* Only render the DialerPopup component when showDialerPopup is true */}
          {context?.showDialerPopup && (
            <DialerPopup setShowDialerPopup={context?.setShowDialerPopup} />
          )}
        </div>
      )}
      <div
        style={{
          width: "100vw",
          height: "100vh",
          display: "flex",
        }}
      >
        <div
          id="chatUI"
          style={{
            visibility: context?.showPdf ? "hidden" : "visible",
            position: "fixed",
            top: "0",
            bottom: "0",
            width: "100%",
          }}
        >
          <NavBar />
          <ChatUiWindow />
        </div>
      </div>

      {/* Mobile View */}
      <style jsx>{`
        @media (max-width: 767px) {
          #chatUI {
            width: 100% !important;
          }
        }
      `}</style>
    </>
  );
};
export default Home;
