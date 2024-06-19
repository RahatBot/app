'use client'
import {
  FC,
  ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef,
} from 'react'
import { AppContext } from '.'
import _ from 'underscore'
import { v4 as uuidv4 } from 'uuid'
import { UserType } from '../types'
import { IntlProvider } from 'react-intl'
import { useLocalization } from '../hooks'
import toast from 'react-hot-toast'
import axios from 'axios'
import { useCookies } from 'react-cookie'
import { UCI } from 'socket-package'
import { XMessage } from '@samagra-x/xmessage'
import saveTelemetryEvent from '../utils/telemetry'

function loadMessages(locale: string) {
  switch (locale) {
    case 'en':
      return import('../../lang/en.json')
    case 'hi':
      return import('../../lang/hi.json')
    default:
      return import('../../lang/en.json')
  }
}

const ContextProvider: FC<{
  locale: any
  localeMsgs: any
  setLocale: any
  children: ReactElement
}> = ({ locale, children, localeMsgs, setLocale }) => {
  const t = useLocalization()
  const [collapsed, setCollapsed] = useState(false) // LeftSide menu bar
  const [pdfList, setPdfList] = useState<any[]>([])
  const [selectedPdf, setSelectedPdf] = useState<any>(null)
  const [uploadingPdf, setUploadingPdf] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [processingPdf, setProcessingPdf] = useState(false) // Used to show spinner while API req is on pending
  const [users, setUsers] = useState<UserType[]>([])
  const [currentUser, setCurrentUser] = useState<UserType>()
  const [loading, setLoading] = useState(false)
  const [isMsgReceiving, setIsMsgReceiving] = useState(false)
  const [messages, setMessages] = useState<Array<any>>([])
  const [conversationId, setConversationId] = useState<string | null>(
    sessionStorage.getItem('conversationId')
  )
  const [isDown, setIsDown] = useState(true)
  const [showDialerPopup, setShowDialerPopup] = useState(false)
  const [showPopUp, setShowPopUp] = useState(false)
  const [cookie, setCookie, removeCookie] = useCookies()
  const [isAudioPlaying, setIsAudioPlaying] = useState(false)
  const audioRef = useRef(null)
  const [currentPdfId, setCurrentPdfId] = useState('')
  const [keyword, setKeyword] = useState()

  const [conversations, setConversations] = useState([])
  const [audioElement, setAudioElement] = useState(null)
  const [ttsLoader, setTtsLoader] = useState(false)
  const [audioPlaying, setAudioPlaying] = useState(false)
  const [clickedAudioUrl, setClickedAudioUrl] = useState<string | null>(null)
  const [currentQuery, setCurrentQuery] = useState('')
  const [activeAudioId, setActiveAudioId] = useState(null)
  const [newConversationId, setNewConversationId] = useState(uuidv4())
  const [newSocket, setNewSocket] = useState<any>()

  const [endTime, setEndTime] = useState(Date.now())
  const [startTime, setStartTime] = useState(Date.now())

  const [s2tMsgId, sets2tMsgId] = useState('')

  const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || ''
  const UserId = localStorage.getItem('userID')

  useEffect(() => {
    sessionStorage.setItem('conversationId', uuidv4())
  }, [])

  useEffect(() => {
    if (localStorage.getItem('locale')) {
      const disasterString =
        localStorage.getItem('locale') === 'hi'
          ? 'सामान्य आपदा,कोरोना वायरस,भूकंप,बाढ़,आग,सनस्ट्रोक,आतंकी हमला,गड़गड़ाहट'
          : 'General Disaster,Coronavirus,Earthquake,Flood,Fire,Sunstroke,Terrorist Attack,Thunder'
      const options = [
        {
          text: t('label.disasterList'),
          position: 'left',
          repliedTimestamp: new Date().valueOf(),
          exampleOptions: false,
          payload: {
            buttonChoices: disasterString.split(',').map((item) => ({
              key: item,
              text: item,
              backmenu: false,
              hasFullWidth: true,
            })),
            text: t('label.disasterList'),
          },
        },
      ]
      setMessages(options)
    } else {
      const initialMsg = [
        {
          text: 'Welcome to Rahat Bot. You can ask me any questions regarding emergencies. You may select your preferred language',
          position: 'left',
          repliedTimestamp: new Date().valueOf(),
          exampleOptions: true,
          payload: {
            buttonChoices: [
              {
                key: 'hi',
                text: 'हिंदी',
                backmenu: false,
              },
              {
                key: 'en',
                text: 'English',
                backmenu: false,
              },
            ],
            text: 'Welcome to Rahat Bot. You can ask me any questions regarding emergencies. You may select your preferred language ',
          },
          isIgnore: false,
        },
      ]
      setMessages(initialMsg)
    }
  }, [t])

  useEffect(() => {
    if (UserId) {
      setNewSocket(
        new UCI(
          SOCKET_URL,
          {
            transportOptions: {
              polling: {
                extraHeaders: {
                  // Authorization: `Bearer ${localStorage.getItem('auth')}`,
                  channel: 'rahat',
                },
              },
            },
            path: process.env.NEXT_PUBLIC_SOCKET_PATH || '',
            query: {
              deviceId: UserId,
            },
            autoConnect: false,
            transports: ['polling', 'websocket'],
            upgrade: true,
          },
          onMessageReceived
        )
      )
    }
    function cleanup() {
      if (newSocket)
        newSocket.onDisconnect(() => {
          console.log('Socket disconnected')
        })
    }
    return cleanup
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [UserId])

  async function base64WavToPlayableLink(base64Wav: string): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        // Convert Base64 to binary
        const binaryWav = atob(base64Wav)

        // Convert binary to ArrayBuffer
        const arrayBuffer = new ArrayBuffer(binaryWav.length)
        const view = new Uint8Array(arrayBuffer)
        for (let i = 0; i < binaryWav.length; i++) {
          view[i] = binaryWav.charCodeAt(i)
        }

        // Create a Blob from ArrayBuffer
        const blob: any = new Blob([arrayBuffer], { type: 'audio/wav' })

        // Create an object URL from Blob
        const url = URL.createObjectURL(blob)

        resolve(url)
      } catch (error) {
        reject(error)
      }
    })
  }

  // const playAudio = useCallback(async (url: string, content: any) => {

  //     if (!url) {
  //       console.error('Audio URL not provided.');
  //       return;
  //     }
  //     url = await base64WavToPlayableLink(url);
  //     if (audioElement && url) {
  //       //@ts-ignore
  //       if (true) {
  //         // If the same URL is provided and audio is paused, resume playback
  //         //@ts-ignore
  //         if (audioElement.paused) {
  //           setClickedAudioUrl(url);
  //           // setTtsLoader(true);
  //           audioElement
  //             //@ts-ignore
  //             .play()
  //             .then(() => {
  //               // setTtsLoader(false);
  //               setAudioPlaying(true);
  //               console.log('Resumed audio:', url);
  //             })
  //             //@ts-ignore
  //             .catch((error) => {
  //               setAudioPlaying(false);
  //               // setTtsLoader(false);
  //               setAudioElement(null);
  //               setClickedAudioUrl(null);
  //               console.error('Error resuming audio:', error);
  //             });
  //         } else {
  //           // Pause the current audio if it's playing
  //           //@ts-ignore
  //           audioElement.pause();
  //           setAudioPlaying(false);
  //           console.log('Paused audio:', url);
  //         }
  //         return;
  //       } else {
  //         // Pause the older audio if it's playing
  //         //@ts-ignore
  //         audioElement.pause();
  //         setAudioPlaying(false);
  //       }
  //     }
  //     setClickedAudioUrl(url);
  //     // setTtsLoader(true);
  //     const audio = new Audio(url);
  //     audio.playbackRate = 1;
  //     audio.addEventListener('ended', () => {
  //       setAudioElement(null);
  //       setAudioPlaying(false);
  //     });
  //     axios
  //       .get(
  //         `${process.env.NEXT_PUBLIC_BASE_URL}/incrementaudioused/${content?.data?.messageId}`
  //       )
  //       .then((res) => { })
  //       .catch((err) => {
  //         console.log(err);
  //       });
  //     audio
  //       .play()
  //       .then(() => {
  //         // setTtsLoader(false);
  //         setAudioPlaying(true);
  //         console.log('Audio played:', url);
  //         // Update the current audio to the new audio element
  //         //@ts-ignore
  //         setAudioElement(audio);
  //       })
  //       .catch((error) => {
  //         setAudioPlaying(false);
  //         // setTtsLoader(false);
  //         setAudioElement(null);
  //         setClickedAudioUrl(null);
  //         console.error('Error playing audio:', error);
  //       });

  // }, [audioElement]);

  const playAudio = useCallback(
    async (url: string, content: any) => {
      console.log('holai:', { content, url })
      if (!url) {
        console.error('Audio URL not provided.')
        console.log('holai 1')
        return
      }
      console.log('url resp', url)
      url = await base64WavToPlayableLink(url)
      console.log('holai:', { url, audioElement })
      if (audioElement) {
        console.log('holai 2', { audioElement })

        //@ts-ignore
        if (audioElement.paused) {
          //@ts-ignore
          audioElement.play()
          setAudioPlaying(true)
          return
        }
        //@ts-ignore
        if (!audioElement.ended) {
          //@ts-ignore
          audioElement.pause()
          setAudioElement(null)
          setAudioPlaying(false)
          return
        }
        //@ts-ignore
        if (audioElement.src === url) {
          // If the same URL is provided and audio is paused, resume playback
          //@ts-ignore
          if (audioElement.paused) {
            console.log('holai 4')
            setClickedAudioUrl(url)
            setTtsLoader(true)
            audioElement
              //@ts-ignore
              .play()
              .then(() => {
                setTtsLoader(false)
                setAudioPlaying(true)
                console.log('Resumed audio:', url)
              })
              //@ts-ignore
              .catch((error) => {
                setAudioPlaying(false)
                setTtsLoader(false)
                setAudioElement(null)
                setClickedAudioUrl(null)
                console.error('Error resuming audio:', error)
              })
          } else {
            // Pause the current audio if it's playing
            //@ts-ignore
            audioElement.pause()
            setAudioPlaying(false)
            console.log('Paused audio:', url)
          }
          return
        } else {
          // Pause the older audio if it's playing
          //@ts-ignore
          audioElement.pause()
          if (isAudioPlaying) {
            setAudioPlaying(false)
            return
          }
        }
      }

      setClickedAudioUrl(url)
      setTtsLoader(true)
      const audio = new Audio(url)
      audio.playbackRate = 1.15
      audio.addEventListener('ended', () => {
        setAudioElement(null)
        setAudioPlaying(false)
      })

      audio
        .play()
        .then(() => {
          console.log('holai 8')
          setTtsLoader(false)
          setAudioPlaying(true)
          console.log('Audio played:', url)
          // Update the current audio to the new audio element
          //@ts-ignore
          setAudioElement(audio)
        })
        .catch((error) => {
          setAudioPlaying(false)
          setTtsLoader(false)
          setAudioElement(null)
          setClickedAudioUrl(null)
          console.error('Error playing audio:', error)
        })
    },
    [audioElement, isAudioPlaying]
  )

  const updateMsgState = useCallback(
    async ({ msg, media }: { msg: any; media: any }) => {
      console.log('updatemsgstate:', msg)
      if (
        msg?.messageId?.Id &&
        msg?.messageId?.channelMessageId &&
        msg?.messageId?.replyId
      ) {
        if (
          sessionStorage.getItem('conversationId') ===
          msg.messageId.channelMessageId
        ) {
          let word = msg.payload.text
          word = word.replace(/\\n/g, '<br/>')

          setMessages((prev: any) => {
            const updatedMessages = [...prev]
            const existingMsgIndex = updatedMessages.findIndex(
              (m: any) => m.messageId === msg.messageId.Id
            )
            console.log('existingMsgIndex', existingMsgIndex)

            if (existingMsgIndex !== -1) {
              // Update the existing message with the new word
              if (word.endsWith('<end/>')) {
                updatedMessages[existingMsgIndex].isEnd = true
              }
              updatedMessages[existingMsgIndex].text =
                word.replace(/<end\/>/g, '') + ' '
            } else {
              let word = msg.payload.text
              word = word.replace(/\\n/g, '<br/>')
              // If the message doesn't exist, create a new one
              const newMsg = {
                text: word.replace(/<end\/>/g, '') + ' ',
                isEnd: word.endsWith('<end/>') ? true : false,
                choices: msg?.payload?.buttonChoices,
                position: 'left',
                reaction: 0,
                messageId: msg?.messageId.Id,
                conversationId: msg.messageId.channelMessageId,
                sentTimestamp: Date.now(),
                card: msg?.payload?.card,
                isGuided: msg?.transformer?.metaData?.isGuided || false,
                // btns: msg?.payload?.buttonChoices,
                // audio_url: msg?.content?.audio_url,
                // metaData: msg.payload?.metaData
                //     ? JSON.parse(msg.payload?.metaData)
                //     : null,
                ...media,
              }

              updatedMessages.push(newMsg)
              // console.log('useeffect', newMsg.text);
              try {
                saveTelemetryEvent('0.1', 'E017', 'userQuery', 'responseAt', {
                  botId: process.env.NEXT_PUBLIC_BOT_ID || '',
                  orgId: process.env.NEXT_PUBLIC_ORG_ID || '',
                  userId: localStorage.getItem('userID') || '',
                  conversationId:
                    sessionStorage.getItem('conversationId') || '',
                  messageId: msg.messageId.replyId,
                  text: '',
                  timeTaken: 0,
                })
              } catch (err) {
                console.error(err)
              }
            }
            return updatedMessages
          })
          setIsMsgReceiving(false)
          if (msg.payload.text.endsWith('<end/>')) {
            setEndTime(Date.now())
          }
          setLoading(false)
        }
      }
    },
    [messages]
  )

  console.log('erty:', { conversationId })
  console.log('ankit:', { newSocket })

  const getConversations = useCallback(() => {
    if (!cookie['access_token']) return
    axios
      .get(`${process.env.NEXT_PUBLIC_BASE_URL}/user/conversations`, {
        headers: {
          Authorization: `Bearer ${cookie['access_token']}`,
        },
      })
      .then((res) => {
        console.log('history', res.data)
        const sortedConversations = [...res.data].sort((a, b) => {
          const dateA = new Date(a.updatedAt)
          const dateB = new Date(b.updatedAt)
          //@ts-ignore
          return dateB - dateA
        })

        //@ts-ignore
        setConversations(sortedConversations)
      })
      .catch((err) => {
        console.log(err)
        toast.error('Could not load your chat history!')
      })
  }, [cookie])

  // useEffect(() => {
  //   getConversations();
  // }, [getConversations, conversationId]);
  useEffect(() => {
    const postTelemetry = async () => {
      console.log('MESSAGE:', messages)
      if (messages.length > 0)
        try {
          await saveTelemetryEvent(
            '0.1',
            'E033',
            'messageQuery',
            'messageReceived',
            {
              botId: process.env.NEXT_PUBLIC_BOT_ID || '',
              orgId: process.env.NEXT_PUBLIC_ORG_ID || '',
              userId: localStorage.getItem('userID') || '',
              phoneNumber: localStorage.getItem('phoneNumber') || '',
              conversationId: sessionStorage.getItem('conversationId') || '',
              replyId: messages?.[messages.length - 2]?.messageId,
              messageId: messages?.[messages.length - 1]?.messageId,
              text: messages[messages.length - 1]?.text,
              createdAt: Math.floor(new Date().getTime() / 1000),
              timeTaken: endTime - startTime,
            }
          )
        } catch (err) {
          console.log(err)
        }
    }
    postTelemetry()
  }, [endTime])

  const onMessageReceived = useCallback(
    async (msg: any) => {
      // if (!msg?.content?.id) msg.content.id = '';
      if (msg.messageType.toUpperCase() === 'IMAGE') {
        await updateMsgState({
          msg: msg,
          media: { imageUrls: msg?.content?.media_url },
        })
      } else if (msg.messageType.toUpperCase() === 'AUDIO') {
        updateMsgState({
          msg,
          media: { audioUrl: msg?.content?.media_url },
        })
      } else if (msg.messageType.toUpperCase() === 'HSM') {
        updateMsgState({
          msg,
          media: { audioUrl: msg?.content?.media_url },
        })
      } else if (msg.messageType.toUpperCase() === 'VIDEO') {
        updateMsgState({
          msg,
          media: { videoUrl: msg?.content?.media_url },
        })
      } else if (
        msg.messageType.toUpperCase() === 'DOCUMENT' ||
        msg.messageType.toUpperCase() === 'FILE'
      ) {
        updateMsgState({
          msg,
          media: { fileUrl: msg?.content?.media_url },
        })
      } else if (msg.messageType.toUpperCase() === 'TEXT') {
        await updateMsgState({
          msg: msg,
          media: null,
        })
      }
    },
    [updateMsgState]
  )

  const onChangeCurrentUser = useCallback((newUser: UserType) => {
    setCurrentUser({ ...newUser, active: true })
    // setMessages([]);
  }, [])

  //@ts-ignore
  const sendMessage = useCallback(
    async (text: string, media: any) => {
      console.log('holai:', { text, media })
      // if (
      //   !localStorage.getItem('userID') ||
      //   !sessionStorage.getItem('conversationId')
      // ) {
      //   removeCookie('access_token', { path: '/' });
      //   location?.reload();
      //   return;
      // }
      // console.log('mssgs:', messages)
      setIsMsgReceiving(true)

      setLoading(true)

      //  console.log('mssgs:',messages)
      const messageId = s2tMsgId ? s2tMsgId : uuidv4()
      setStartTime(Date.now())

      if (media) {
        if (media.mimeType.slice(0, 5) === 'image') {
        } else if (media.mimeType.slice(0, 5) === 'audio') {
        } else if (media.mimeType.slice(0, 5) === 'video') {
        } else if (media.mimeType.slice(0, 11) === 'application') {
        } else {
        }
      } else {
        //console.log('mssgs:',messages)
        //@ts-ignore
        setMessages((prev: any) => [
          ...prev.map((prevMsg: any) => ({ ...prevMsg })),
          {
            username: localStorage.getItem('userID'),
            text: text,
            position: 'right',
            botUuid: currentUser?.id,
            payload: { text },
            time: Date.now(),
            disabled: true,
            messageId: messageId,
            repliedTimestamp: Date.now(),
          },
        ])
        // Send the user's message to API
        // const data = {
        //   body: text,
        //   messageId: msgId,
        //   conversationId: sessionStorage.getItem('conversationId'),
        //   // mobileNumber: localStorage.getItem('phoneNumber'),
        // };
        const data = {
          text: text,
          media: '',
          inputLanguage: locale || 'en',
        }

        try {
          newSocket.sendMessage({
            payload: {
              app: process.env.NEXT_PUBLIC_BOT_ID || '',
              payload: {
                text: text?.replace('&', '%26')?.replace(/^\s+|\s+$/g, ''),
                metaData: {
                  latitude: sessionStorage.getItem('latitude'),
                  longitude: sessionStorage.getItem('longitude'),
                  city: sessionStorage.getItem('city'),
                  state: sessionStorage.getItem('state'),
                  ip: sessionStorage.getItem('ip'),
                },
              },
              tags: JSON.parse(sessionStorage.getItem('tags') || '[]') || [],
              from: {
                userID: localStorage.getItem('userID'),
              },
              messageId: {
                Id: messageId,
                channelMessageId: sessionStorage.getItem('conversationId'),
              },
            } as Partial<XMessage>,
          })
          newSocket.addEventListener('message', (event: any) => {
            // Parse the message data
            const message = JSON.parse(event.data)
            console.log('message', message)
            // Handle the incoming message here
          })

          // const response = await axios.post(
          //   `${process.env.NEXT_PUBLIC_BASE_URL}/prompt`,
          //   data,
          //   {
          //     headers: {
          //       'Content-Type': 'application/json',
          //       'user-id': localStorage.getItem('userID'),
          //       'Conversation-Id': newConversationId,
          //     },
          //   }
          // )

          // // Handle response here
          // console.log('hie', response?.data)
          // onMessageReceived({
          //   content: {
          //     title: response?.data?.text || response?.data?.error,
          //     msg_type: 'TEXT',
          //     choices: null,
          //     conversationId: sessionStorage.getItem('conversationId'),
          //     audio_url: response?.data?.audio?.text || '',
          //     flowEnd: response?.data?.flowEnd,
          //   },
          //   messageId: response?.data?.messageId,
          // })
        } catch (error) {
          // Handle error here
          // onMessageReceived({
          //   content: {
          //     title: 'Something went wrong. Please try again later.',
          //     msg_type: 'TEXT',
          //     choices: null,
          //     conversationId: sessionStorage.getItem('conversationId'),
          //     audio_url: '',
          //   },
          //   messageId: msgId,
          // })
          // setIsMsgReceiving(false)
          // setLoading(false)
          // console.log(error)
        }
      }
      try {
        await saveTelemetryEvent('0.1', 'E032', 'messageQuery', 'messageSent', {
          botId: process.env.NEXT_PUBLIC_BOT_ID || '',
          orgId: process.env.NEXT_PUBLIC_ORG_ID || '',
          userId: localStorage.getItem('userID') || '',
          conversationId: sessionStorage.getItem('conversationId') || '',
          messageId: messageId,
          text: text,
          createdAt: Math.floor(new Date().getTime() / 1000),
        })
      } catch (err) {
        console.error(err)
      }
      sets2tMsgId('')
    },
    [currentUser?.id, locale, newSocket, onMessageReceived, newConversationId]
  )

  const fetchIsDown = useCallback(async () => {
    try {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_BASE_URL}/health/20`
      )
      const status = res.data.status
      console.log('hie', status)
      if (status === 'OK') {
        setIsDown(false)
      } else {
        setIsDown(true)
        console.log('Server status is not OK')
      }
    } catch (error) {
      console.error(error)
    }
  }, [setIsDown])

  useEffect(() => {
    if (isDown) return
    let secondTimer: any
    const timer = setTimeout(() => {
      if (isMsgReceiving && loading) {
        toast.error(`${t('message.taking_longer')}`)
        secondTimer = setTimeout(() => {
          if (isMsgReceiving && loading) {
            toast.error(`${t('message.retry')}`)
            setIsMsgReceiving(false)
            setLoading(false)
            fetchIsDown()
          }
        }, 25000)
      }
    }, 15000)

    return () => {
      clearTimeout(timer)
      clearTimeout(secondTimer)
    }
  }, [fetchIsDown, isDown, isMsgReceiving, loading, t])

  const values = useMemo(
    () => ({
      currentUser,
      allUsers: users,
      toChangeCurrentUser: onChangeCurrentUser,
      sendMessage,
      messages,
      setMessages,
      loading,
      setLoading,
      isMsgReceiving,
      setIsMsgReceiving,
      locale,
      setLocale,
      localeMsgs,
      setConversationId,
      isDown,
      fetchIsDown,
      showDialerPopup,
      setShowDialerPopup,
      showPopUp,
      setShowPopUp,
      isAudioPlaying,
      setIsAudioPlaying,
      audioRef,
      pdfList,
      setPdfList,
      selectedPdf,
      setSelectedPdf,
      uploadingPdf,
      setUploadingPdf,
      uploadProgress,
      setUploadProgress,
      processingPdf,
      setProcessingPdf,
      collapsed,
      setCollapsed,
      currentPdfId,
      setCurrentPdfId,
      keyword,
      setKeyword,
      getConversations,
      conversations,
      playAudio,
      ttsLoader,
      clickedAudioUrl,
      audioPlaying,
      currentQuery,
      setCurrentQuery,
      activeAudioId,
      setActiveAudioId,
      newConversationId,
      setNewConversationId,
      newSocket,
    }),
    [
      activeAudioId,
      setActiveAudioId,
      currentQuery,
      setCurrentQuery,
      locale,
      setLocale,
      localeMsgs,
      currentUser,
      users,
      onChangeCurrentUser,
      sendMessage,
      messages,
      loading,
      setLoading,
      isMsgReceiving,
      setIsMsgReceiving,
      setConversationId,
      isDown,
      fetchIsDown,
      showDialerPopup,
      setShowDialerPopup,
      showPopUp,
      setShowPopUp,
      isAudioPlaying,
      setIsAudioPlaying,
      audioRef,
      pdfList,
      setPdfList,
      selectedPdf,
      setSelectedPdf,
      uploadingPdf,
      setUploadingPdf,
      uploadProgress,
      setUploadProgress,
      processingPdf,
      setProcessingPdf,
      collapsed,
      setCollapsed,
      currentPdfId,
      setCurrentPdfId,
      keyword,
      setKeyword,
      getConversations,
      conversations,
      playAudio,
      ttsLoader,
      clickedAudioUrl,
      audioPlaying,
      newConversationId,
      setNewConversationId,
      newSocket,
    ]
  )

  return (
    //@ts-ignore
    <AppContext.Provider value={values}>
      <IntlProvider locale={locale} messages={localeMsgs}>
        {children}
      </IntlProvider>
    </AppContext.Provider>
  )
}

const SSR: FC<{ children: ReactElement }> = ({ children }) => {
  const [locale, setLocale] = useState('')
  const [localeMsgs, setLocaleMsgs] = useState<Record<string, string> | null>(
    null
  )
  useEffect(() => {
    setLocale(localStorage.getItem('locale') || 'en')
  }, [])

  useEffect(() => {
    loadMessages(locale).then((res) => {
      //@ts-ignore
      setLocaleMsgs(res)
    })
  }, [locale])

  if (typeof window === 'undefined') return null
  return (
    //@ts-ignore
    <IntlProvider locale={locale} messages={localeMsgs}>
      <ContextProvider
        locale={locale}
        setLocale={setLocale}
        localeMsgs={localeMsgs}
      >
        {children}
      </ContextProvider>
    </IntlProvider>
  )
}
export default SSR
