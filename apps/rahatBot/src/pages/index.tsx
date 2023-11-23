import type { NextPage } from 'next';
import Head from 'next/head';
import { useLocalization } from '../hooks/useLocalization';
import dynamic from 'next/dynamic';
import LeftSide from '../components/LeftSide';
import { AppContext } from '../context';
import { useContext, useEffect, useState } from 'react';
import NavBar from '../components/NavBar';
// import LaunchPage from '../components/LaunchPage';
// import LoginPage from '../components/LoginPage';
// import { useLogin } from '../hooks';

const ChatUiWindow = dynamic(
  () => import('../components/ChatWindow/ChatUiWindow'),
  { ssr: false }
);

const Home: NextPage = () => {
  const t = useLocalization();
  const context = useContext(AppContext);
  // const [isMobile, setIsMobile] = useState(true);

  // useEffect(() => {
  //   // Use a simple check for mobile devices based on window width
  //   const handleResize = () => {
  //     setIsMobile(window.innerWidth <= 767);
  //   };

  //   // Initial check on component mount
  //   handleResize();

  //   // Add event listener for window resize
  //   window.addEventListener('resize', handleResize);

  //   // Cleanup the event listener on component unmount
  //   return () => {
  //     window.removeEventListener('resize', handleResize);
  //   };
  // }, []);
  // const { isAuthenticated, login } = useLogin();
  // const { isLoggedIn } = context;
  // const [showLaunchPage, setShowLaunchPage] = useState(true);

  // useEffect(() => {
  //   if (!isAuthenticated) {
  //     login();
  //   }
  // }, [isAuthenticated, login]);

  // useEffect(() => {
  //   setTimeout(() => {
  //     setShowLaunchPage(!showLaunchPage);
  //   }, 2200);
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, []);

  // if (showLaunchPage) {
  //   return <LaunchPage />;
  // } else if (isLoggedIn) {
    return (
      <>
        <Head>
          <title> {t('label.title')}</title>
        </Head>
        <div
          style={{
            width: '100vw',
            height: '100vh',
            display: 'flex',
          }}>
         {/* {!isMobile && (
          <div
            style={{
              backgroundColor: '#b99825',
              flex: '0.2',
              color: 'white',
              transition: 'all 0.2s ease',
            }}>
            <LeftSide />
          </div>
        )} */}
          {/* <div
            style={{
              flex: '0.8',
              height: '100vh',
            }}> */}
            <div
              id="chatUI"
              style={{
                visibility: context?.showPdf ? 'hidden' : 'visible',
                position: 'fixed',
                top: '0',
                bottom: '0',
                width: '100%',
              }}>
              <NavBar />
              <ChatUiWindow />
            </div>
          </div>
        {/* </div> */}

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
  // } else {
  //   return <LoginPage />;
  // }
};
export default Home;
