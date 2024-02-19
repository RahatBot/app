import { useContext, useCallback } from 'react';
import styles from './index.module.css';
import YogiModiImg from '../../assets/images/yogimodi.png';
import UPGovtLogo from '../../assets/images/up-govt-logo.png';
import plusIcon from '../../assets/icons/plus.svg';
import Image from 'next/image';
import { logEvent } from 'firebase/analytics';
// import { analytics } from '../../utils/firebase';
import { AppContext } from '../../context';
import router from 'next/router';
import { v4 as uuidv4 } from 'uuid';
import { useLocalization } from '../../hooks';
import toast from 'react-hot-toast';
import flagsmith from 'flagsmith/isomorphic';
import axios from 'axios';
import React from 'react';
import { useCookies } from 'react-cookie';

function NavBar() {
  const t = useLocalization();
  const context = useContext(AppContext);
  const [cookie, setCookies] = useCookies();
  const defaultLang = flagsmith.getValue('default_lang', { fallback: 'hi' });
  const [isEngActive, setIsEngActive] = React.useState(
    localStorage.getItem('locale')
      ? localStorage.getItem('locale') === 'en'
      : defaultLang === 'en'
  );

  const toggleLanguage = React.useCallback(
    (newLanguage: string) => () => {
      if (newLanguage === context?.locale) return;
      localStorage.setItem('locale', newLanguage);
      context?.setLocale(newLanguage);
      setIsEngActive((prev) => (prev === true ? false : true));
    },
    [context]
  );

  const newChatHandler = useCallback(() => {
    if (context?.isMsgReceiving) {
      toast.error(`${t('error.wait_new_chat')}`);
      return;
    }


    const newConversationId = uuidv4();
    sessionStorage.setItem('conversationId', newConversationId);
    if (context?.audioElement) context?.audioElement.pause();
    if (context?.setAudioPlaying) context?.setAudioPlaying(false);
    context?.setConversationId(newConversationId);
    context?.setMessages([]);
    context?.setIsMsgReceiving(false);
    context?.setLoading(false);
    router.push('/');
    toast.success(`${t('label.new_chat_started')}`);
  }, [context, t]);

  if (router.pathname === '/chat' && !context?.isDown) {
    return (
      <div className={styles.navbar + ' ' + styles.main}>
        <div
          style={{ width: '120px', display: 'flex', alignItems: 'flex-end' }}>
          {/* <Sidemenu /> */}
          <div
            style={{
              paddingLeft: '15px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-end',
            }}>
            <Image
              src={plusIcon}
              alt=""
              width={28}
              height={28}
              onClick={newChatHandler}
            />
            <p style={{ color: 'var(--primary)', fontSize: '12px' }}>
              {t('label.new_chat')}
            </p>
          </div>
        </div>
        <div>
          <Image src={UPGovtLogo} alt="" width={60} height={60} />
        </div>
        <div>
          <Image src={YogiModiImg} alt="" width={110} height={65} />
        </div>
      </div>
    );
  } else
    return (
      <div className={styles.main} style={router.pathname === '/login' ? { height: '120px' } : {}}>
        <div
          className={styles.navbar} >

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button
              id="eng"
              className={isEngActive ? styles.active : styles.btn}
              style={{ borderRadius: '10px 0px 0px 10px' }}
              onClick={toggleLanguage('en')}>
              ENG
            </button>
            <button
              id="hindi"
              className={!isEngActive ? styles.active : styles.btn}
              style={{ borderRadius: '0px 10px 10px 0px' }}
              onClick={toggleLanguage('hi')}>
              हिंदी
            </button>
          </div>

          <div
          >
            <Image src={UPGovtLogo} alt="" width={60} height={60} />

          </div>
          <div>

            <Image src={YogiModiImg} alt="" width={110} height={65} />

          </div>

        </div>
        {router.pathname === '/login' && (
          <div
            className={styles.title}
            dangerouslySetInnerHTML={{ __html: t('label.title') }}></div>
        )}
      </div>
    );
}

export default NavBar;
