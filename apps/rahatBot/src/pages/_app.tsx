import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { ChakraProvider } from '@chakra-ui/react';
import ContextProvider from '../context/ContextProvider';
import { ReactElement, useEffect } from 'react';
import 'chatui/dist/index.css';
import { Toaster } from 'react-hot-toast';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
// import flagsmith from 'flagsmith/isomorphic';
// import { FlagsmithProvider } from 'flagsmith/react';

function SafeHydrate({ children }: { children: ReactElement }) {
  return (
    <div suppressHydrationWarning>
      {typeof window === 'undefined' ? null : children}
    </div>
  );
}

const App = ({ Component, pageProps }: AppProps) => {
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
    (async () => {
      const data = await axios.post(`${process.env.NEXT_PUBLIC_BASE_URL}/user/generateUserId/${uuidv4()}`)
      localStorage.setItem('userID', data.data);
    })();
  }, []);

  if (process.env.NODE_ENV === 'production') {
    globalThis.console.log = () => {};
  }

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
  );
};

export default App;
