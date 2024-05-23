import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { ChakraProvider } from '@chakra-ui/react'
import ContextProvider from '../context/ContextProvider'
import { ReactElement, useEffect, useState } from 'react'
import 'rahatbot_chatui/dist/index.css'
import { Toaster } from 'react-hot-toast'
import axios from 'axios'
import { v4 as uuidv4 } from 'uuid'
import dynamic from 'next/dynamic'
import FingerprintJS from '@fingerprintjs/fingerprintjs'

// import flagsmith from 'flagsmith/isomorphic';
// import { FlagsmithProvider } from 'flagsmith/react';
const LaunchPage = dynamic(() => import('../components/LaunchPage'), {
  ssr: false,
})
function SafeHydrate({ children }: { children: ReactElement }) {
  return (
    <div suppressHydrationWarning>
      {typeof window === 'undefined' ? null : children}
    </div>
  )
}

const App = ({ Component, pageProps }: AppProps) => {
  const [launch, setLaunch] = useState(true)
  useEffect(() => {
    setTimeout(() => {
      setLaunch(false)
    }, 2500)
  }, [])
  // const [flagsmithState, setflagsmithState] = useState(null);

  // useEffect(() => {
  //   const getFlagSmithState = async () => {
  //     await flagsmith.init({
  //       // eslint-disable-next-line turbo/no-undeclared-env-vars
  //       environmentID: process.env.NEXT_PUBLIC_ENVIRONMENT_ID || '',
  //     });
  //     if (flagsmith.getState()) {
  //       //@ts-ignore
  //       setflagsmithState(flagsmith.getState());
  //     }
  //   };
  //   getFlagSmithState();
  // }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const fp = await FingerprintJS.load()
        const { visitorId } = await fp.get()
        localStorage.setItem('userID', visitorId)
      } catch (error) {
        console.error('Error fetching or setting data:', error)
      }
    }

    fetchData()
  }, [])

  if (process.env.NODE_ENV === 'production') {
    globalThis.console.log = () => {}
  }
  if (launch) return <LaunchPage />
  return (
    <ChakraProvider>
      {/* @ts-ignore */}
      {/* <FlagsmithProvider flagsmith={flagsmith} serverState={flagsmithState}> */}
      <ContextProvider>
        <div style={{ height: '100%' }}>
          <Toaster position="top-center" reverseOrder={false} />
          <SafeHydrate>
            <Component {...pageProps} />
          </SafeHydrate>
        </div>
      </ContextProvider>
      {/* </FlagsmithProvider> */}
    </ChakraProvider>
  )
}

export default App
