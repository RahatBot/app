import {
  Bubble,
  Image as Img,
  ScrollView,
  List,
  ListItem,
  FileCard,
  Video,
  Typing,
  RichText,
  //@ts-ignore
} from "rahatbot_chatui";
import axios from "axios";
import React, {
  FC,
  ReactElement,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { v4 as uuidv4 } from "uuid";
import { toast } from "react-hot-toast";
import Image from "next/image";
import styles from "./index.module.css";
import RightIcon from "../../assets/icons/right.jsx";
import SpeakerIcon from "../../assets/icons/speaker.svg";
import SpeakerPauseIcon from "../../assets/icons/speakerPause.png";
import reloadIcon from "../../assets/icons/reload.svg";
import CopyText from "../../assets/icons/copy-text.svg";
import MsgThumbsUp from "../../assets/icons/msg-thumbs-up.jsx";
import MsgThumbsDown from "../../assets/icons/msg-thumbs-down.jsx";
import { AppContext } from "../../context";
import { ChatMessageItemPropType } from "../../types";
import { getFormatedTime } from "../../utils/getUtcTime";
import { useLocalization } from "../../hooks/useLocalization";
import { getReactionUrl } from "../../utils/getUrls";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { Button } from "@chakra-ui/react";
import { useCookies } from "react-cookie";
import Loader from "../loader";

const getToastMessage = (t: any, reaction: number): string => {
  if (reaction === 1) return t("toast.reaction_like");
  return t("toast.reaction_reset");
};
const ChatMessageItem: FC<ChatMessageItemPropType> = ({
  currentUser,
  message,
  onSend,
}) => {
  const t = useLocalization();
  const context = useContext(AppContext);
  const [reaction, setReaction] = useState(message?.content?.data?.reaction);
  const [cookies, setCookie, removeCookie] = useCookies(["access_token"]);

  useEffect(() => {
    setReaction(message?.content?.data?.reaction);
  }, [message?.content?.data?.reaction]);

  const showDisasterOptions = useCallback(
    (lang: string) => {
      context?.setNewConversationId(uuidv4());
      const disasterString =
        lang === "hi"
        ? "सामान्य आपदा,कोरोना वायरस,भूकंप,बाढ़,आग,लू,आतंकी हमला,गड़गड़ाहट"
        : "General Disaster,Coronavirus,Earthquake,Flood,Fire,Sunstroke,Terrorist Attack,Thunder";
      const options = [
        {
        //  text: lang === "hi" ? "आपदा चुनें" : "Select Disaster",
          text: t('label.disasterList') ,
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
      context?.setMessages((prev: any) => [...prev, ...options]);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [context?.setMessages,t,context?.setNewConversationId]
  );

  
  const onLikeDislike = useCallback(
    ({ value, msgId }: { value: 0 | 1 | -1; msgId: string }) => {
      let url = getReactionUrl({ msgId, reaction: value });
      if (value === -1) {
        context?.setCurrentQuery(msgId);
        context?.setShowDialerPopup(true);
        return
      }
      axios
        .get(url, {
          // headers: {
          //   authorization: `Bearer ${cookies.access_token}`,
          // },
        })
        .then((res: any) => {
          // if (value === -1) {
          //   context?.setCurrentQuery(msgId);
          //   context?.setShowDialerPopup(true);
          // } 
          
            toast.success(`${getToastMessage(t, value)}`);
          
        })
        .catch((error: any) => {
          console.error(error);
        });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t]
  );

  async function copyTextToClipboard(text: string) {
    console.log("here");
    if ("clipboard" in navigator) {
      return await navigator.clipboard.writeText(text);
    } else {
      return document.execCommand("copy", true, text);
    }
  }
  const feedbackHandler = useCallback(
    ({ like, msgId }: { like: 0 | 1 | -1; msgId: string }) => {
      console.log("vbnm:", { reaction, like, msgId });
      if (reaction === 0) {
        setReaction(like);
        return onLikeDislike({ value: like, msgId });
      }
      if (reaction === 1 && like === -1) {
        console.log("vbnm triggered 1");
        setReaction(-1);
        return onLikeDislike({ value: -1, msgId });
      }
      if (reaction === -1 && like === 1) {
        console.log("vbnm triggered 2");
        setReaction(1);
        return onLikeDislike({ value: 1, msgId });
      }

      console.log("vbnm triggered");
      onLikeDislike({ value: 0, msgId });
      setReaction(0);
    },
    [onLikeDislike, reaction]
  );

  const getLists = useCallback(
    ({ choices, isDisabled }: { choices: any; isDisabled: boolean }) => {
      console.log("hola qwer12:", {
        choices,
        isDisabled,
        isFull: !context?.messages?.[0]?.exampleOptions,
      });
      return (
        <List
          className={`${context?.messages?.[0]?.exampleOptions
              ? styles.list
              : styles.fullList
            }`}
        >
          {choices?.map((choice: any, index: string) => (
            <ListItem
              key={`${index}_${choice?.key}`}
              className={`${styles.onHover} ${choice?.hasFullWidth ? styles.fullListItem : styles.listItem
                }`}
              onClick={(e: any): void => {
                e.preventDefault();
                console.log("hola", { key: choice.key, isDisabled });
                if (isDisabled) {
                  toast.error(`${t("message.cannot_answer_again")}`);
                } else {
                  if (context?.messages?.[0]?.exampleOptions) {
                    console.log("clearing chat");
                    console.log("hola:", { key: choice?.key });
                    context?.setMessages([]);
                    localStorage.setItem("locale", choice?.key);
                    context?.setLocale(choice?.key);
                    showDisasterOptions(choice?.key);
                  } else context?.sendMessage(choice.text);
                }
              }}
            >
              <div className="onHover">
                <div style={{ textAlign: "center" }}>{choice.text}</div>
                {/* <div style={{ marginLeft: 'auto' }}>
                  <RightIcon width="5.5vh" color="var(--secondary)" />
                </div> */}
              </div>
            </ListItem>
          ))}
        </List>
      );
    },
    [context, showDisasterOptions, t]
  );

  // useEffect(() => {
  //   // Add event listeners to the buttons
  //   const buttons = document.querySelectorAll('.reference');
  //   console.log('i ran', buttons);
  //   buttons.forEach((button, index) => {
  //     button.addEventListener('click', () =>
  //       textHighlighter(content, button?.classList?.[1])
  //     );
  //   });

  //   return () => {
  //     buttons.forEach((button, index) => {
  //       button.removeEventListener('click', () =>
  //         textHighlighter(content, button?.classList?.[1])
  //       );
  //     });
  //   };
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [context?.messages]);

  // const textHighlighter = (content: any, id: any) => {
  //   context?.setShowPdf(true);
  //   console.log('here', content, id);
  //   if (!id) return;
  //   let desiredItem = null;
  //   if (content?.data?.highlightText) {
  //     for (const item of content.data.highlightText) {
  //       console.log('okie', item.documentId, id, item.content);
  //       if (item.documentId == id) {
  //         console.log('okie here');
  //         desiredItem = item;
  //         break;
  //       }
  //     }
  //     console.log('okie', desiredItem);
  //     if (!desiredItem) {
  //       context?.setKeyword(content?.data?.highlightText?.[0]);
  //     } else {
  //       if (
  //         content?.data?.position === 'left' &&
  //         content?.data?.highlightText
  //       ) {
  //         if (context?.keyword && context?.keyword?.id !== desiredItem?.id) {
  //           context?.setKeyword(desiredItem);
  //         } else if (!context?.keyword) {
  //           context?.setKeyword(desiredItem);
  //         }
  //       }
  //     }
  //   }
  // };

  // const addMarkup = (word: any) => {
  //   return word.replace(
  //     /\[(\d+)\]/g,
  //     (match: any, p1: any) =>
  //       `<sup class="reference ${p1}" style="margin-right: 2px; color: var(--secondary)"><button>${p1}</button></sup>`
  //   );
  // };

  const newChatHandler = () => {
    showDisasterOptions(context?.locale)
    // if (context?.loading) {
    //   toast.error("Please wait for a response!");
    //   return;
    // }
    // context?.setMessages([]);
    // const newConversationId = uuidv4();
    // const newUserId = uuidv4();
    // localStorage.setItem("userID", newUserId);
    // sessionStorage.setItem("conversationId", newConversationId);
    // context?.setConversationId(newConversationId);
    // toast.success("New chat started!");
  };

  const { content, type } = message;
  console.log({ content });

  const handleAudio = (url: any,id:string) => {
    // console.log(url)
    if (!url) {
      toast.error("No audio");
      return;
    }
   context?.setActiveAudioId(id)
   setTimeout(()=>{ context?.playAudio(url, content);},10)
    
    
  };

 
  // const sanitizedText = content?.text?.replace(/\n/g, '\n ');

  // const formattedContent = sanitizedText ? sanitizedText
  //   ?.split(' ')
  //   ?.map((word: any, index: number) => addMarkup(word))
  //   ?.join(' ') : 'Something went wrong. Please try later.';
console.log("shriram:",{rr:content?.text})
  switch (type) {
    case "loader":
      return <Typing />;
    case "text":
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            position: "relative",
            maxWidth: "100%",
          }}
        >
          {/* <div
            className={
              content?.data?.position === 'right'
                ? styles.messageTriangleRight
                : styles.messageTriangleLeft
            }></div> */}
          <Bubble type="text" style={{textAlign:'left'}}>
            <span
              className={styles.onHover}
              style={{
                fontWeight: 600,
                fontSize: "16px",
                color:
                  content?.data?.position === "right" ? "white" : "var(--font)",
              }}
            >
              {/* <Markdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
                className="text-right"
                components={{
                  li: ({ children }) => (
                    <li style={{ marginLeft: "20px" ,textAlign:'right'}}>dd{children}</li>
                  ),
                  a: ({ node, ...props }) => (
                    <a
                      target="_blank"
                      style={{
                        textDecoration: "underline",
                        color: "#0000ffb7",
                      }}
                      {...props}
                    >
                      {props.children}
                    </a>
                  ),
                }}
              >
           
           {  content?.text.replace(/-/g," ") }
             
          
              </Markdown> */}
              <div dangerouslySetInnerHTML={{ __html: content?.text }}></div>
              {/* <RichText content={formatText(formattedContent)} /> */}
            </span>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  color:
                    content?.data?.position === "right"
                      ? "white"
                      : "var(--font)",
                  fontSize: "12px",
                }}
                className="font-regular"
              >
                {getFormatedTime(
                  content?.data?.sentTimestamp ||
                  content?.data?.repliedTimestamp
                )}
              </span>
            </div>
          </Bubble>
          {content?.data?.position === "left" && (
            <div style={{ display: "flex", position: "relative", top: "-5px" }}>
              <div className={styles.msgFeedback}>
                <div className={styles.msgFeedbackIcons}>
                  <div
                    style={{ cursor: "pointer" }}
                    onClick={() =>
                      feedbackHandler({
                        like: 1,
                        msgId: content?.data?.messageId,
                      })
                    }
                  >
                    <MsgThumbsUp
                      fill={reaction === 1}
                      width="20px"
                      color="var(--secondary)"
                    />
                  </div>
                  <div
                    style={{ cursor: "pointer" }}
                    onClick={() =>
                      feedbackHandler({
                        like: -1,
                        msgId: content?.data?.messageId,
                      })
                    }
                  >
                    <MsgThumbsDown
                      fill={reaction === -1}
                      width="20px"
                      color="var(--secondary)"
                    />
                  </div>
                </div>
                &nbsp;
                <p>{t("message.helpful")}</p>
              </div>
              <div
                className={styles.msgSpeaker}
                onClick={() => handleAudio(content?.data?.audio_url || "",content?.data?.messageId)}
              >
               
                {context?.clickedAudioUrl === content?.data?.audio_url ? (
                  context?.ttsLoader ? (
                    <Loader />
                  ) : (
                    <Image
                      src={
                        // !context?.audioPlaying ? SpeakerIcon : SpeakerPauseIcon
                        context?.audioPlaying ?  SpeakerPauseIcon : SpeakerIcon 
                      }
                      width={!context?.audioPlaying ? 15 : 40}
                      height={!context?.audioPlaying ? 15 : 30}
                      alt=""
                    />
                  )
                ) : (
                  <Image src={context?.activeAudioId === content?.data?.messageId && context?.audioPlaying ?    SpeakerPauseIcon : SpeakerIcon } width={15} height={15} alt="" />
                )}
              </div>
            </div>
          )}
          
          {content?.data?.position === "left" && (
            // content?.data?.flowEnd === "true" && (
              <div className={styles.reloadButton} onClick={newChatHandler}>
                <Image src={reloadIcon} width={25} height={25} alt="" />
              </div>
            )}
        </div>
      );
    case "options": {
      return (
        <Bubble type="text">
          <div style={{ display: "flex" }}>
            <span
              style={{ fontSize: "16px" }}
              dangerouslySetInnerHTML={{ __html: `${content?.text}` }}
            ></span>
          </div>
          <div style={{ marginTop: "10px" }} />
          {getLists({
            choices:
              content?.data?.payload?.buttonChoices ?? content?.data?.choices,
            isDisabled: content?.data?.disabled,
          })}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "self-end",
            }}
          >
            <span style={{ color: "var(--grey)", fontSize: "10px" }}>
              {/* {moment
          .utc(
            content?.data?.sentTimestamp ||
              content?.data?.repliedTimestamp
          )
          .local()
          .format("DD/MM/YYYY : hh:mm")} */}
            </span>
            <span></span>
          </div>
        </Bubble>
      );
    }
    case "image": {
      const url = content?.data?.payload?.media?.url || content?.data?.imageUrl;
      return (
        <>
          {content?.data?.position === "left" && (
            <div
              style={{
                width: "40px",
                marginRight: "4px",
                textAlign: "center",
              }}
            ></div>
          )}
          <Bubble type="image">
            <div style={{ padding: "7px" }}>
              <Img src={url} width="299" height="200" alt="image" lazy fluid />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "self-end",
                }}
              >
                <span style={{ color: "var(--font)", fontSize: "10px" }}>
                  {getFormatedTime(
                    content?.data?.sentTimestamp ||
                    content?.data?.repliedTimestamp
                  )}
                </span>
              </div>
            </div>
          </Bubble>
        </>
      );
    }

    case "file": {
      const url = content?.data?.payload?.media?.url || content?.data?.fileUrl;
      return (
        <>
          {content?.data?.position === "left" && (
            <div
              style={{
                width: "40px",
                marginRight: "4px",
                textAlign: "center",
              }}
            ></div>
          )}
          <Bubble type="image">
            <div style={{ padding: "7px" }}>
              <FileCard file={url} extension="pdf" />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "self-end",
                }}
              >
                <span style={{ color: "var(--font)", fontSize: "10px" }}>
                  {getFormatedTime(
                    content?.data?.sentTimestamp ||
                    content?.data?.repliedTimestamp
                  )}
                </span>
              </div>
            </div>
          </Bubble>
        </>
      );
    }

    case "video": {
      const url = content?.data?.payload?.media?.url || content?.data?.videoUrl;
      return (
        <>
          {content?.data?.position === "left" && (
            <div
              style={{
                width: "40px",
                marginRight: "4px",
                textAlign: "center",
              }}
            ></div>
          )}
          <Bubble type="image">
            <div style={{ padding: "7px" }}>
              <Video
                cover="https://uxwing.com/wp-content/themes/uxwing/download/video-photography-multimedia/video-icon.png"
                src={url}
              />

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "self-end",
                }}
              >
                <span style={{ color: "var(--font)", fontSize: "10px" }}>
                  {getFormatedTime(
                    content?.data?.sentTimestamp ||
                    content?.data?.repliedTimestamp
                  )}
                </span>
              </div>
            </div>
          </Bubble>
        </>
      );
    }

    default:
      return (
        <ScrollView
          data={[]}
          // @ts-ignore
          renderItem={(item): ReactElement => <Button label={item.text} />}
        />
      );
  }
};

export default ChatMessageItem;
