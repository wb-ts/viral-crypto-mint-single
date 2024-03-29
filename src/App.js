import React, { useEffect, useState, useRef, isValidElement } from "react";
import { useDispatch, useSelector } from "react-redux";
import { connect, getSmartContract } from "./redux/blockchain/blockchainActions";
import axios from 'axios';
import { fetchData } from "./redux/data/dataActions";
import * as s from "./styles/globalStyles";
import styled from "styled-components";
import { getProof , getInfo, getRoot } from "./merkleTree";

const truncate = (input, len) =>
  input.length > len ? `${input.substring(0, len)}...` : input;

export const StyledButton = styled.button`
  padding: 10px;
  border-radius: 50px;
  border: none;
  background-color: var(--secondary);
  padding: 10px;
  font-weight: bold;
  color: var(--secondary-text);
  width: 100px;
  cursor: pointer;
  box-shadow: 0px 6px 0px -2px rgba(250, 250, 250, 0.3);
  -webkit-box-shadow: 0px 6px 0px -2px rgba(250, 250, 250, 0.3);
  -moz-box-shadow: 0px 6px 0px -2px rgba(250, 250, 250, 0.3);
  :active {
    box-shadow: none;
    -webkit-box-shadow: none;
    -moz-box-shadow: none;
  }
`;

export const StyledButtonDisabled = styled.button`
  padding: 10px;
  border-radius: 50px;
  border: none;
  background-color: grey;
  padding: 10px;
  font-weight: bold;
  color: var(--secondary-text);
  width: max-content;
  cursor: pointer;
  box-shadow: 0px 6px 0px -2px rgba(250, 250, 250, 0.3);
  -webkit-box-shadow: 0px 6px 0px -2px rgba(250, 250, 250, 0.3);
  -moz-box-shadow: 0px 6px 0px -2px rgba(250, 250, 250, 0.3);
`;

export const StyledRoundButton = styled.button`
  padding: 10px;
  border-radius: 100%;
  border: none;
  background-color: var(--primary);
  padding: 10px;
  font-weight: bold;
  font-size: 15px;
  color: var(--primary-text);
  width: 30px;
  height: 30px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0px 4px 0px -2px rgba(250, 250, 250, 0.3);
  -webkit-box-shadow: 0px 4px 0px -2px rgba(250, 250, 250, 0.3);
  -moz-box-shadow: 0px 4px 0px -2px rgba(250, 250, 250, 0.3);
  :active {
    box-shadow: none;
    -webkit-box-shadow: none;
    -moz-box-shadow: none;
  }
`;

export const ResponsiveWrapper = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: center;
  align-items: stretched;
  width: 100%;
  @media (min-width: 767px) {
    flex-direction: row;
  }
`;

export const StyledLogo = styled.img`
  width: 240px;
  @media (min-width: 767px) {
    width: 300px;
  }
  transition: width 0.5s;
  transition: height 0.5s;
  margin-top: 40px;
`;

export const StyledImg = styled.img`
  box-shadow: 0px 5px 11px 2px rgba(0, 0, 0, 0.7);
  border: 4px solid var(--secondary);
  background-color: var(--accent);
  border-radius: none;
  width: 270px;
  @media (min-width: 500px) {
    width: 330px;
  }
  @media (min-width: 767px) {
    width: 400px;
  }
  @media (min-width: 900px) {
    width: 420px;
  }
  @media (min-width: 1000px) {
    width: 500px;
  }
  transition: width 0.5s;
`;

export const StyledLink = styled.a`
  color: var(--secondary);
  text-decoration: none;
`;

function App() {
  const dispatch = useDispatch();
  const blockchain = useSelector((state) => state.blockchain);
  const MORALIS_API_KEY = '78KU4WCpkqjIAkGjSKbtRuYg7rjbfnEQkMtt6fLbVFh7chlqi3courfnXFjo461K';
  const data = useSelector((state) => state.data);
  const [mintedCount, setMintedCount] = useState(null);
  const [claiming, setClaiming] = useState(false);
  const [feedback, setFeedback] = useState(`Click Claim below to claim whitelisted.`);
  const [proof , setProof] = useState([]);
  const [isWhitelisted , setIswhitelisted] = useState(false);
  const [CONFIG, SET_CONFIG] = useState({
    CONTRACT_ADDRESS: "",
    SCAN_LINK: "",
    NETWORK: {
      NAME: "",
      SYMBOL: "",
      ID: 0,
    },
    NFT_NAME: "",
    SYMBOL1: "",
    MAX_SUPPLY: 1,
    WEI_COST: 0,
    DISPLAY_COST: 0,
    GAS_LIMIT: 0,
    MARKETPLACE: "",
    MARKETPLACE_LINK: "",
    SHOW_BACKGROUND: false,
  });
  const [walletInfo, setWalletInfo] = useState({
    "pure" : "0",
    "vested" : "0"
  });

  const claim = () => {
    
    blockchain.smartContract.methods
      .claim(walletInfo.vested, walletInfo.pure, proof)
      .send({
        gasLimit: String(CONFIG.GAS_LIMIT),
        to: CONFIG.CONTRACT_ADDRESS,
        from: blockchain.account,
      })
      .once("error", (err) => {
        console.log(err);
        setFeedback("Sorry, something went wrong please try again later.");
        setClaiming(false);
      })
      .then((receipt) => {
        console.log(receipt);
        setFeedback(
          `WOW, claimed successfully.`
        );
        setClaiming(false);
        dispatch(fetchData(blockchain.account));
      });


  };

  // const decrementMintAmount = () => {
  //   let newMintAmount = mintAmount - 1;
  //   if (newMintAmount < 1) {
  //     newMintAmount = 1;
  //   }
  //   setMintAmount(newMintAmount);
  // };

  // const incrementMintAmount = () => {
  //   let newMintAmount = mintAmount + 1;
  //   if (newMintAmount > 3) {
  //     newMintAmount = 3;
  //   }
  //   setMintAmount(newMintAmount);
  // };

  const verifyClaimBytes = async (address , pure , vested , proof) => {
    let res = await blockchain.smartContract.methods.verifyClaimBytes(address , vested , pure , proof).call();
    return res;
  }

  const getData = async () => {
    // if (blockchain.account !== "" && blockchain.smartContract !== null) {
    //   dispatch(fetchData(blockchain.account));
    // }

    let address = blockchain.account;
    if(address){
      let walletInfo = await getInfo(address);
      console.log("walletInfo:",walletInfo)
      let proof = await getProof(address, walletInfo);
      let merkleRoot = await getRoot();
      console.log("merkleRoot:",merkleRoot);
      console.log("Proof:",proof);
      setProof(proof);
      setWalletInfo(walletInfo);
      let isWhitelisted = await verifyClaimBytes( address , walletInfo.pure , walletInfo.vested , proof) ;
      setIswhitelisted(isWhitelisted);
    }
  };

  const getConfig = async () => {
    const configResponse = await fetch("/config/config.json", {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });
    const config = await configResponse.json();

    

    SET_CONFIG(config);
  };

  useEffect(() => {
    getConfig();
  }, []);

  useEffect(() => {
    getData();
  }, [blockchain.account]);

  return (
    <s.Screen>
      <s.Container
        flex={1}
        ai={"center"}
        style={{ padding: 12, backgroundColor: "var(--primary)" }}
        image={CONFIG.SHOW_BACKGROUND ? "/config/images/wallpaper.jpg" : null}
      >
        <s.SpacerSmall />
        <s.SpacerSmall />
        <s.SpacerSmall />
        <a href={CONFIG.MARKETPLACE_LINK}>
          <StyledLogo alt={"logo"} src={"/config/images/logo.png"} />
        </a>
        <s.SpacerMedium />
        <s.Container jc={"center"} ai={"center"} style={{ width: "70%", maxWidth: "700px" }}>
          <s.TextDescription
            style={{
              textAlign: "center",
              color: "var(--primary-text)",
              fontSize: "20px"
            }}
          >
            The Sentinel gives passage into Viral Crypto.
          </s.TextDescription>
          <s.SpacerSmall />
          <s.TextDescription
            style={{
              textAlign: "center",
              color: "var(--primary-text)",
              fontSize: "20px"
            }}
          >
            Minting and possessing a Sentinel rewards you with VC tokens, gives you access to create a profile on the VC platform, and also reserves an allocation to mint a unique generative avatar that grants benefits on Viral Crypto.
          </s.TextDescription>
          <s.SpacerSmall />
        </s.Container>
        <ResponsiveWrapper flex={1} style={{ padding: 12 }} test>
          <s.Container
            flex={2}
            jc={"center"}
            ai={"center"}
            style={{
              backgroundColor: "var(--accent)",
              padding: 24,
              borderRadius: 24,
              border: "4px solid var(--secondary)",
              boxShadow: "0px 5px 11px 2px rgba(0,0,0,0.7)",
              maxWidth: "700px",
            }}
          >
            <s.TextTitle
              style={{ textAlign: "center", fontSize: 50, color: "var(--accent-text)" }}
            >
              {CONFIG.SYMBOL1}
            </s.TextTitle>
            {
              blockchain.account ?
                <s.Container ai={"center"} jc={"center"} fd={"row"}>
                  <s.TextDescription 
                    style={{
                      textAlign:"center",
                      margin: "0 10px 0 10px"
                    }}>
                    <s.TextTitle>Non-vested tokens</s.TextTitle>
                    <s.TextTitle
                      style={{
                        textAlign: "center",
                        fontSize: 42,
                        fontWeight: "bold",
                        color: "var(--accent-text)",
                      }}
                    >
                      {(Number(walletInfo.pure)/ (10**18)) % 1 != 0 ? (Number(walletInfo.pure)/ (10**18)).toFixed(2) : (Number(walletInfo.pure)/ (10**18))}
                    </s.TextTitle>
                  </s.TextDescription>
                  <s.TextDescription 
                    style={{
                      textAlign:"center",
                      margin: "0 10px 0 10px"
                    }}>
                    <s.TextTitle>Vested tokens</s.TextTitle>
                    <s.TextTitle
                      style={{
                        textAlign: "center",
                        fontSize: 42,
                        fontWeight: "bold",
                        color: "var(--accent-text)",
                      }}
                    >
                      {(Number(walletInfo.vested)/ (10**18)) % 1 != 0 ? (Number(walletInfo.vested)/ (10**18)).toFixed(2) : (Number(walletInfo.vested)/ (10**18))}
                    </s.TextTitle>
                  </s.TextDescription>
                </s.Container> : ""}
            <s.SpacerSmall />
            {Number(mintedCount) >= CONFIG.MAX_SUPPLY ? (
              <>
                <s.TextTitle
                  style={{ textAlign: "center", color: "var(--accent-text)" }}
                >
                  The sale has ended.
                </s.TextTitle>
                <s.TextDescription
                  style={{ textAlign: "center", color: "var(--accent-text)" }}
                >
                  You can still find {CONFIG.NFT_NAME} on
                </s.TextDescription>
                <s.SpacerSmall />
                <StyledLink target={"_blank"} href={CONFIG.MARKETPLACE_LINK}>
                  {CONFIG.MARKETPLACE}
                </StyledLink>
              </>
            ) : (
              <>
                <s.SpacerSmall />
                {blockchain.account === "" ||
                  blockchain.smartContract === null ? (
                  <s.Container ai={"center"} jc={"center"}>
                    <StyledButton
                      onClick={(e) => {
                        e.preventDefault();
                        dispatch(connect());
                        getData();
                      }}
                    >
                      CONNECT
                    </StyledButton>
                    {blockchain.errorMsg !== "" ? (
                      <>
                        <s.SpacerSmall />
                        <s.TextDescription
                          style={{
                            textAlign: "center",
                            color: "var(--accent-text)",
                          }}
                        >
                          {blockchain.errorMsg}
                        </s.TextDescription>
                      </>
                    ) : null}
                  </s.Container>
                ) : (
                  isWhitelisted ? 
                  <>
                    <s.TextDescription
                      style={{
                        textAlign: "center",
                        color: "var(--accent-text)",
                      }}
                    >
                      {feedback}
                    </s.TextDescription>
                    <s.SpacerMedium />
                    <s.Container ai={"center"} jc={"center"} fd={"row"}>
                      <StyledButton
                        disabled={claiming ? 1 : 0}
                        onClick={(e) => {
                          e.preventDefault();
                          claim();
                          getData();
                        }}
                      >
                        {claiming ? "BUSY" : "Claim"}
                      </StyledButton>
                    </s.Container>
                  </>
                  :
                  <s.Container ai={"center"} jc={"center"}>
                    <StyledButtonDisabled>
                      Nothing to claim.
                    </StyledButtonDisabled>
                  </s.Container>
                )}
              </>
            )}
            <s.SpacerMedium />
          </s.Container>

        </ResponsiveWrapper>
        <s.SpacerLarge />
        <s.SpacerLarge />
        {/* <s.Container jc={"center"} ai={"center"} style={{ width: "70%" }}>
          <s.TextDescription
            style={{
              textAlign: "center",
              color: "var(--primary-text)",
            }}
          >
            Please make sure you are connected to the right network (
            {CONFIG.NETWORK.NAME} Mainnet) and the correct address. Please note:
            Once you make the purchase, you cannot undo this action.
          </s.TextDescription>
          <s.SpacerSmall />
          <s.TextDescription
            style={{
              textAlign: "center",
              color: "var(--primary-text)",
            }}
          >
            We have set the gas limit to {CONFIG.GAS_LIMIT} for the contract to
            successfully mint your NFT. We recommend that you don't lower the
            gas limit.
          </s.TextDescription>
        </s.Container> */}
      </s.Container>
    </s.Screen>
  );
}

export default App;
