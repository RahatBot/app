import axios from 'axios';
//@ts-ignore
import Chat from 'chatui';
import React, {
  ReactElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { AppContext } from '../../context';
import { useLocalization } from '../../hooks';
import { getMsgType } from '../../utils/getMsgType';
import ChatMessageItem from '../chat-message-item';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';
import RenderVoiceRecorder from '../recorder/RenderVoiceRecorder';
import { IconButton } from '@chakra-ui/react';
import { green } from '@material-ui/core/colors';
// import NavBar from '../NavBar';
// import { logEvent, setUserProperties } from 'firebase/analytics';
// import { analytics } from '../../utils/firebase';
// import { useFlags } from 'flagsmith/react';

const ChatUiWindow: React.FC = () => {
  const t = useLocalization();
  const context = useContext(AppContext);
  const [divHeight, setDivHeight] = useState<any>('87%');
  // const flags = useFlags([
  //   'example_ques_one',
  //   'example_ques_two',
  //   'example_ques_three',
  // ]);

  const updateDivHeight = () => {
    const newHeight = window.innerWidth < 768 ? window.innerHeight - 100 : '87%';
    setDivHeight(newHeight);
  };

  useEffect(() => {
    updateDivHeight();
    window.addEventListener('resize', updateDivHeight);
    return () => {
      window.removeEventListener('resize', updateDivHeight);
    };
  }, []);

  useEffect(() => {
    // should be logged in, should have phone number, should not trigger again in one session and should have username
    if (
      context?.isLoggedIn &&
      localStorage.getItem('phoneNumber') &&
      !sessionStorage.getItem('triggered') &&
      localStorage.getItem('username')
    ) {
      // //@ts-ignore
      // setUserProperties(analytics, { name: localStorage.getItem('username') });
      // //@ts-ignore
      // logEvent(analytics, localStorage.getItem('phoneNumber'), {
      //   username: localStorage.getItem('username'),
      // });
      sessionStorage.setItem('triggered', 'true');
    }
  }, [context?.isLoggedIn]);

  const normalizedChat = (chats: any): any => {
    console.log('in normalized');
    const conversationId = sessionStorage.getItem('conversationId');
    const history = chats
      .filter(
        (item: any) =>
          conversationId === 'null' || item.conversationId === conversationId
      )
      .flatMap((item: any) => [
        {
          text: item.query,
          position: 'right',
          repliedTimestamp: item.createdAt,
          messageId: uuidv4(),
        },
        {
          text: item.response,
          position: 'left',
          sentTimestamp: item.createdAt,
          reaction: item.reaction,
          msgId: item.id,
          messageId: item.id,
        },
      ]);

    console.log('historyyy', history);
    console.log('history length:', history.length);

    return history;
  };

  useEffect(() => {
    if (!sessionStorage.getItem('conversationId')) {
      const newConversationId = uuidv4();
      sessionStorage.setItem('conversationId', newConversationId);
      context?.setConversationId(newConversationId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSend = useCallback(
    async (type: string, msg: any) => {
      if (msg.length === 0) {
        toast.error(t('error.empty_msg'));
        return;
      }
      console.log('mssgs:', context?.messages);
      if (type === 'text' && msg.trim()) {
        context?.sendMessage(msg.trim());
      }
    },
    [context, t]
  );
  const normalizeMsgs = useMemo(
    () =>
      context?.messages?.map((msg: any) => ({
        type: getMsgType(msg),
        content: { text: msg?.text, data: { ...msg } },
        position: msg?.position ?? 'right',
        messageId: msg?.messageId,
      })),
    [context?.messages]
  );
  console.log('fghj:', { messages: context?.messages });
  const msgToRender = useMemo(() => {
    return context?.isMsgReceiving
      ? [
        ...normalizeMsgs,
        {
          type: 'loader',
          position: 'left',
          botUuid: '1',
        },
      ]
      : normalizeMsgs;
  }, [context?.isMsgReceiving, normalizeMsgs]);

  console.log('debug:', { msgToRender });

  const placeholder = useMemo(() => t('message.ask_ur_question'), [t]);

  const quickReplyClickHandler = (e: any) => {
    if (context?.loading) {
      toast.error('Please wait for reply!');
      return;
    }
    handleSend('text', e.name);
  }

  return (
    <>
      {/* sidebar backdrop div */}
      <div
        style={{
          background: context?.collapsed ? 'rgba(0, 0, 0, 0.6)' : '',
          position: context?.collapsed ? 'absolute' : 'static',
          top: '0',
          bottom: '0',
          left: '0',
          right: '0',
          zIndex: context?.collapsed ? '111' : '0',
        }}></div>
      <div style={{
        position: 'fixed',
        height: divHeight,
        width: '100%',
        bottom: '10vh',
        top: '100px',
       
      //  paddingTop:'10px',
       borderTopRightRadius:'20px',
       borderTopLeftRadius:'20px',
       textAlign:'center'
      }}
      >
       
        <Chat
          // quickReplies={[
          //   {
          //     name:
          //       // flags?.example_ques_one?.value ||
          //        'When is the next holiday?',
          //   },
          //   {
          //     name:
          //       // flags?.example_ques_two?.value ||
          //       'How can I create a good one-pager?',
          //   },
          //   {
          //     name:
          //       // flags?.example_ques_three?.value ||
          //       'What is a Samagra case study?',
          //   }
          // ]}
          // onQuickReplyClick={quickReplyClickHandler}
          btnColor="var(--secondary)"
          background="var(--bg-color)"
          disableSend={context?.loading}
          //@ts-ignore
          messages={msgToRender}
          voiceToText={RenderVoiceRecorder}
          //@ts-ignore
          renderMessageContent={(props): ReactElement => (
            <ChatMessageItem
              key={props}
              message={props}
              currentUser={context?.currentUser}
              onSend={handleSend}
            />
          )}
          LeftAction={<IconButton aria-label='refreshIcon' icon={<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#b99825"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fill-rule="evenodd" clip-rule="evenodd" d="M13.7071 1.29289C14.0976 1.68342 14.0976 2.31658 13.7071 2.70711L12.4053 4.00896C17.1877 4.22089 21 8.16524 21 13C21 17.9706 16.9706 22 12 22C7.02944 22 3 17.9706 3 13C3 12.4477 3.44772 12 4 12C4.55228 12 5 12.4477 5 13C5 16.866 8.13401 20 12 20C15.866 20 19 16.866 19 13C19 9.2774 16.0942 6.23349 12.427 6.01281L13.7071 7.29289C14.0976 7.68342 14.0976 8.31658 13.7071 8.70711C13.3166 9.09763 12.6834 9.09763 12.2929 8.70711L9.29289 5.70711C9.10536 5.51957 9 5.26522 9 5C9 4.73478 9.10536 4.48043 9.29289 4.29289L12.2929 1.29289C12.6834 0.902369 13.3166 0.902369 13.7071 1.29289Z" fill="#b99825"></path> </g></svg>} />}
        // LeftAction={<button>refresh</button>}
          onSend={handleSend}
          locale="en-US"
          placeholder={placeholder}

        />
        
      </div>
    </>
  );
};

export default ChatUiWindow;
