"use client";
import {
  FC,
  ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef,
} from "react";
import { AppContext } from ".";
import _ from "underscore";
import { v4 as uuidv4 } from "uuid";
import { UserType } from "../types";
import { IntlProvider } from "react-intl";
import { useLocalization } from "../hooks";
import toast from "react-hot-toast";
import axios from "axios";
import { useCookies } from "react-cookie";

function loadMessages(locale: string) {
  switch (locale) {
    case "en":
      return import("../../lang/en.json");
    case "hi":
      return import("../../lang/hi.json");
    default:
      return import("../../lang/en.json");
  }
}

const ContextProvider: FC<{
  locale: any;
  localeMsgs: any;
  setLocale: any;
  children: ReactElement;
}> = ({ locale, children, localeMsgs, setLocale }) => {
  const t = useLocalization();
  const [collapsed, setCollapsed] = useState(false); // LeftSide menu bar
  const [pdfList, setPdfList] = useState<any[]>([]);
  const [selectedPdf, setSelectedPdf] = useState<any>(null);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingPdf, setProcessingPdf] = useState(false); // Used to show spinner while API req is on pending
  const [users, setUsers] = useState<UserType[]>([]);
  const [currentUser, setCurrentUser] = useState<UserType>();
  const [loading, setLoading] = useState(false);
  const [isMsgReceiving, setIsMsgReceiving] = useState(false);
  const [messages, setMessages] = useState<Array<any>>([]);
  const [conversationId, setConversationId] = useState<string | null>(
    sessionStorage.getItem("conversationId")
  );
  const [isDown, setIsDown] = useState(true);
  const [showDialerPopup, setShowDialerPopup] = useState(false);
  const [showPopUp, setShowPopUp] = useState(false);
  const [cookie, setCookie, removeCookie] = useCookies();
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const audioRef = useRef(null);
  const [currentPdfId, setCurrentPdfId] = useState("");
  const [keyword, setKeyword] = useState();
  const [isLoggedIn, setIsLoggedIn] = useState(
    cookie["access_token"] && localStorage.getItem("userID")
  );
  const [showPdf, setShowPdf] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [audioElement, setAudioElement] = useState(null);
  const [ttsLoader, setTtsLoader] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [clickedAudioUrl, setClickedAudioUrl] = useState<string | null>(null);
  const [currentQuery, setCurrentQuery] = useState("");

  useEffect(() => {
    if (localStorage.getItem("locale")) {
      const disasterString =
        localStorage.getItem("locale") === "hi"
        ? "सामान्य आपदा, कोरोना वायरस, भूकंप, बाढ़, आग, लू, आतंकी हमला, गड़गड़ाहट"
        : "General Disaster, Corona Virus, Earthquake, Flood, Fire, Sunstroke, Terrorist Attack, Thunder";
      const options = [
        {
          // text:
          //   localStorage.getItem("locale") === "hi"
          //     ? "आपदा चुनें"
          //     : "Select Disaster",
          text: t('label.disasterList'),
          position: "left",
          repliedTimestamp: new Date().valueOf(),
          exampleOptions: false,
          payload: {
            buttonChoices: disasterString
              .split(",")
              .map((item) => ({
                key: item,
                text: item,
                backmenu: false,
                hasFullWidth: true,
              })),
          text: t('label.disasterList'),
          },
        },
      ];
      setMessages(options);
    } else {
      const initialMsg = [
        {
          text: "Welcome to Rahat Bot. You can ask me any questions regarding emergencies. You may select your preferred language",
          position: "left",
          repliedTimestamp: new Date().valueOf(),
          exampleOptions: true,
          payload: {
            buttonChoices: [
              {
                key: "hi",
                text: "Hindi",
                backmenu: false,
              },
              {
                key: "en",
                text: "English",
                backmenu: false,
              },
            ],
            text: "Welcome to Rahat Bot. You can ask me any questions regarding emergencies. You may select your preferred language ",
          },
          isIgnore: false,
        },
      ];
      setMessages(initialMsg);
    }
  }, [t]);
  async function base64WavToPlayableLink(base64Wav: string): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        // Convert Base64 to binary
        const binaryWav = atob(base64Wav);

        // Convert binary to ArrayBuffer
        const arrayBuffer = new ArrayBuffer(binaryWav.length);
        const view = new Uint8Array(arrayBuffer);
        for (let i = 0; i < binaryWav.length; i++) {
          view[i] = binaryWav.charCodeAt(i);
        }

        // Create a Blob from ArrayBuffer
        const blob = new Blob([arrayBuffer], { type: "audio/wav" });

        // Create an object URL from Blob
        const url = URL.createObjectURL(blob);

        resolve(url);
      } catch (error) {
        reject(error);
      }
    });
  }

  const playAudio = useMemo(() => {
    return async (url: string, content: any) => {
      if (!url) {
        console.error("Audio URL not provided.");
        return;
      }
      url = await base64WavToPlayableLink(url);
      if (audioElement) {
        //@ts-ignore
        if (audioElement.src === url) {
          // If the same URL is provided and audio is paused, resume playback
          //@ts-ignore
          if (audioElement.paused) {
            setClickedAudioUrl(url);
            setTtsLoader(true);
            audioElement
              //@ts-ignore
              .play()
              .then(() => {
                setTtsLoader(false);
                setAudioPlaying(true);
                console.log("Resumed audio:", url);
              })
              //@ts-ignore
              .catch((error) => {
                setAudioPlaying(false);
                setTtsLoader(false);
                setAudioElement(null);
                setClickedAudioUrl(null);
                console.error("Error resuming audio:", error);
              });
          } else {
            // Pause the current audio if it's playing
            //@ts-ignore
            audioElement.pause();
            setAudioPlaying(false);
            console.log("Paused audio:", url);
          }
          return;
        } else {
          // Pause the older audio if it's playing
          //@ts-ignore
          audioElement.pause();
          setAudioPlaying(false);
        }
      }
      setClickedAudioUrl(url);
      setTtsLoader(true);
      const audio = new Audio(url);
      audio.playbackRate = 1.15;
      audio.addEventListener("ended", () => {
        setAudioElement(null);
        setAudioPlaying(false);
      });
      // axios
      //   .get(
      //     `${process.env.NEXT_PUBLIC_BASE_URL}/incrementaudioused/${content?.data?.messageId}`
      //   )
      //   .then((res) => {})
      //   .catch((err) => {
      //     console.log(err);
      //   });
      audio
        .play()
        .then(() => {
          setTtsLoader(false);
          setAudioPlaying(true);
          console.log("Audio played:", url);
          // Update the current audio to the new audio element
          //@ts-ignore
          setAudioElement(audio);
        })
        .catch((error) => {
          setAudioPlaying(false);
          setTtsLoader(false);
          setAudioElement(null);
          setClickedAudioUrl(null);
          console.error("Error playing audio:", error);
        });
    };
  }, [audioElement]);

  const updateMsgState = useCallback(
    ({
      user,
      msg,
      media,
    }: {
      user: { name: string; id: string };
      msg: {
        content: {
          title: string;
          choices: any;
          audio_url: string;
          flowEnd: string;
        };
        messageId: string;
      };
      media: any;
    }) => {
      console.log("hie", msg);
      if (msg.content.title !== "") {
        const newMsg = {
          username: user?.name,
          text: msg.content.title,
          choices: msg.content.choices,
          audio_url: msg.content.audio_url,
          flowEnd: msg.content.flowEnd,
          position: "left",
          id: user?.id,
          botUuid: user?.id,
          reaction: 0,
          messageId: msg?.messageId,
          //@ts-ignore
          conversationId: msg?.content?.conversationId,
          sentTimestamp: Date.now(),
          ...media,
        };

        console.log("here", msg, conversationId);
        //@ts-ignore
        if (conversationId === msg?.content?.conversationId) {
          console.log("here", newMsg);
          setMessages((prev: any) => [...prev, newMsg]);
        }
      }
    },
    [conversationId]
  );

  console.log("erty:", { conversationId });

  const getConversations = useCallback(() => {
    if (!cookie["access_token"]) return;
    axios
      .get(`${process.env.NEXT_PUBLIC_BASE_URL}/user/conversations`, {
        headers: {
          Authorization: `Bearer ${cookie["access_token"]}`,
        },
      })
      .then((res) => {
        console.log("history", res.data);
        const sortedConversations = [...res.data].sort((a, b) => {
          const dateA = new Date(a.updatedAt);
          const dateB = new Date(b.updatedAt);
          //@ts-ignore
          return dateB - dateA;
        });

        //@ts-ignore
        setConversations(sortedConversations);
      })
      .catch((err) => {
        console.log(err);
        toast.error("Could not load your chat history!");
      });
  }, [cookie]);

  // useEffect(() => {
  //   getConversations();
  // }, [getConversations, conversationId]);

  const onMessageReceived = useCallback(
    async (msg: any) => {
      console.log("mssgs:", messages);
      console.log("#-debug:", { msg });
      setLoading(false);
      setIsMsgReceiving(false);
      //@ts-ignore
      const user = JSON.parse(localStorage.getItem("currentUser"));

      if (msg.content.msg_type.toUpperCase() === "IMAGE") {
        updateMsgState({
          user,
          msg,
          media: { imageUrl: msg?.content?.media_url },
        });
      } else if (msg.content.msg_type.toUpperCase() === "AUDIO") {
        updateMsgState({
          user,
          msg,
          media: { audioUrl: msg?.content?.media_url },
        });
      } else if (msg.content.msg_type.toUpperCase() === "VIDEO") {
        updateMsgState({
          user,
          msg,
          media: { videoUrl: msg?.content?.media_url },
        });
      } else if (
        msg.content.msg_type.toUpperCase() === "DOCUMENT" ||
        msg.content.msg_type.toUpperCase() === "FILE"
      ) {
        updateMsgState({
          user,
          msg,
          media: { fileUrl: msg?.content?.media_url },
        });
      } else if (msg.content.msg_type.toUpperCase() === "TEXT") {
        updateMsgState({ user, msg, media: {} });
      }
    },
    [messages, updateMsgState]
  );

  const onChangeCurrentUser = useCallback((newUser: UserType) => {
    setCurrentUser({ ...newUser, active: true });
    // setMessages([]);
  }, []);

  //@ts-ignore
  const sendMessage = useCallback(
    async (text: string, media: any) => {
      console.log("holai:",{text,media})
      // if (
      //   !localStorage.getItem('userID') ||
      //   !sessionStorage.getItem('conversationId')
      // ) {
      //   removeCookie('access_token', { path: '/' });
      //   location?.reload();
      //   return;
      // }
      // console.log('mssgs:', messages)
      setIsMsgReceiving(true);

      setLoading(true);

      //  console.log('mssgs:',messages)
      if (media) {
        if (media.mimeType.slice(0, 5) === "image") {
        } else if (media.mimeType.slice(0, 5) === "audio") {
        } else if (media.mimeType.slice(0, 5) === "video") {
        } else if (media.mimeType.slice(0, 11) === "application") {
        } else {
        }
      } else {
        const msgId = uuidv4();
        //console.log('mssgs:',messages)
        //@ts-ignore
        setMessages((prev: any) => [
          ...prev.map((prevMsg: any) => ({ ...prevMsg })),
          {
            username: localStorage.getItem("userID"),
            text: text,
            position: "right",
            botUuid: currentUser?.id,
            payload: { text },
            time: Date.now(),
            disabled: true,
            messageId: msgId,
            repliedTimestamp: Date.now(),
          },
        ]);
        // Send the user's message to API
        // const data = {
        //   body: text,
        //   messageId: msgId,
        //   conversationId: sessionStorage.getItem('conversationId'),
        //   // mobileNumber: localStorage.getItem('phoneNumber'),
        // };
        const data = {
          text: text,
          media: "",
          inputLanguage: locale || "en",
        };

        try {
          const response = await axios.post(
            `${process.env.NEXT_PUBLIC_BASE_URL}/prompt`,
            data,
            {
              headers: {
                "Content-Type": "application/json",
                "user-id": localStorage.getItem("userID"),
              },
            }
          );

          // Handle response here
          console.log("hie", response?.data);
          onMessageReceived({
            content: {
              title: response?.data?.text || response?.data?.error,
              msg_type: "TEXT",
              choices: null,
              conversationId: sessionStorage.getItem("conversationId"),
              audio_url: response?.data?.audio?.text || "",
              flowEnd: response?.data?.flowEnd,
            },
            messageId: response?.data?.messageId,
          });
        } catch (error) {
          // Handle error here
          onMessageReceived({
            content: {
              title: "Something went wrong. Please try again later.",
              msg_type: "TEXT",
              choices: null,
              conversationId: sessionStorage.getItem("conversationId"),
              audio_url: "",
            },
            messageId: msgId,
          });
          setIsMsgReceiving(false);
          setLoading(false);
          console.log(error);
        }
      }
    },
    [currentUser?.id, locale, onMessageReceived]
  );

  const fetchIsDown = useCallback(async () => {
    try {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_BASE_URL}/health/20`
      );
      const status = res.data.status;
      console.log("hie", status);
      if (status === "OK") {
        setIsDown(false);
      } else {
        setIsDown(true);
        console.log("Server status is not OK");
      }
    } catch (error) {
      console.error(error);
    }
  }, [setIsDown]);

  useEffect(() => {
    if (isDown) return;
    let secondTimer: any;
    const timer = setTimeout(() => {
      if (isMsgReceiving && loading) {
        toast.error(`${t("message.taking_longer")}`);
        secondTimer = setTimeout(() => {
          if (isMsgReceiving && loading) {
            toast.error(`${t("message.retry")}`);
            setIsMsgReceiving(false);
            setLoading(false);
            fetchIsDown();
          }
        }, 25000);
      }
    }, 15000);

    return () => {
      clearTimeout(timer);
      clearTimeout(secondTimer);
    };
  }, [fetchIsDown, isDown, isMsgReceiving, loading, t]);

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
      isLoggedIn,
      setIsLoggedIn,
      showPdf,
      setShowPdf,
      getConversations,
      conversations,
      playAudio,
      ttsLoader,
      clickedAudioUrl,
      audioPlaying,
      currentQuery,
      setCurrentQuery,
    }),
    [
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
      isLoggedIn,
      setIsLoggedIn,
      showPdf,
      setShowPdf,
      getConversations,
      conversations,
      playAudio,
      ttsLoader,
      clickedAudioUrl,
      audioPlaying,
    ]
  );

  return (
    //@ts-ignore
    <AppContext.Provider value={values}>
      <IntlProvider locale={locale} messages={localeMsgs}>
        {children}
      </IntlProvider>
    </AppContext.Provider>
  );
};

const SSR: FC<{ children: ReactElement }> = ({ children }) => {
  const [locale, setLocale] = useState("");
  const [localeMsgs, setLocaleMsgs] = useState<Record<string, string> | null>(
    null
  );
  useEffect(() => {
    setLocale(localStorage.getItem("locale") || "en");
  }, []);

  useEffect(() => {
    loadMessages(locale).then((res) => {
      //@ts-ignore
      setLocaleMsgs(res);
    });
  }, [locale]);

  if (typeof window === "undefined") return null;
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
  );
};
export default SSR;
