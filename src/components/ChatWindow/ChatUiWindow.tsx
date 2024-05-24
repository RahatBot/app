import axios from 'axios'
//@ts-ignore
import Chat from 'rahatbot_chatui'
import React, {
  ReactElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { AppContext } from '../../context'
import { useLocalization } from '../../hooks'
import { getMsgType } from '../../utils/getMsgType'
import ChatMessageItem from '../chat-message-item'
import { v4 as uuidv4 } from 'uuid'
import toast from 'react-hot-toast'
import RenderVoiceRecorder from '../recorder/RenderVoiceRecorder'

const ChatUiWindow: React.FC = () => {
  const t = useLocalization()
  const context = useContext(AppContext)
  const [divHeight, setDivHeight] = useState<any>('87%')

  const updateDivHeight = () => {
    const newHeight = window.innerWidth < 768 ? window.innerHeight - 100 : '87%'
    setDivHeight(newHeight)
  }

  useEffect(() => {
    updateDivHeight()
    window.addEventListener('resize', updateDivHeight)
    return () => {
      window.removeEventListener('resize', updateDivHeight)
    }
  }, [])

  useEffect(() => {
    if (
      context?.isLoggedIn &&
      localStorage.getItem('phoneNumber') &&
      !sessionStorage.getItem('triggered') &&
      localStorage.getItem('username')
    ) {
      sessionStorage.setItem('triggered', 'true')
    }
  }, [context?.isLoggedIn])

  useEffect(() => {
    if (!sessionStorage.getItem('conversationId')) {
      const newConversationId = uuidv4()
      sessionStorage.setItem('conversationId', newConversationId)
      context?.setConversationId(newConversationId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSend = useCallback(
    async (type: string, msg: any) => {
      if (msg.length === 0) {
        toast.error(t('error.empty_msg'))
        return
      }
      console.log('mssgs:', context?.messages)
      if (type === 'text' && msg.trim()) {
        context?.sendMessage(msg.trim())
      }
    },
    [context, t]
  )
  const normalizeMsgs = useMemo(
    () =>
      context?.messages?.map((msg: any) => ({
        type: getMsgType(msg),
        content: { text: msg?.text, data: { ...msg } },
        position: msg?.position ?? 'right',
        messageId: msg?.messageId,
      })),
    [context?.messages]
  )

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
      : normalizeMsgs
  }, [context?.isMsgReceiving, normalizeMsgs])

  const placeholder = useMemo(() => t('message.ask_ur_question'), [t])
  const refreshLabel = useMemo(() => t('message.refresh_label'), [t])

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
          zIndex: context?.collapsed ? 111 : 0,
        }}
      ></div>
      <div
        style={{
          position: 'fixed',
          height: divHeight,
          width: '100%',
          bottom: '10vh',
          top: '100px',
          borderTopRightRadius: '20px',
          borderTopLeftRadius: '20px',
          textAlign: 'center',
        }}
      >
        <Chat
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
          onSend={handleSend}
          locale="en-US"
          placeholder={placeholder}
          refreshLabel={refreshLabel}
        />
      </div>
    </>
  )
}

export default ChatUiWindow
