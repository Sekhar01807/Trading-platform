import React, { useState } from "react";

import BuyActionWindow from "./BuyActionWindow";
import SellActionWindow from "./SellActionWindow";
import StockChart from "./StockChart";
import StockDetails from "./StockDetails";

const GeneralContext = React.createContext({
  openBuyWindow: (uid) => { },
  closeBuyWindow: () => { },
  openSellWindow: (uid) => { },
  closeSellWindow: () => { },
});

export const GeneralContextProvider = (props) => {
  const [activeWindow, setActiveWindow] = useState(null); // "BUY", "SELL", "CHART", "MORE", null
  const [selectedStockUID, setSelectedStockUID] = useState("");
  const [selectedStockPrice, setSelectedStockPrice] = useState(0);

  const handleOpenBuyWindow = (uid, price = 0) => {
    setActiveWindow("BUY");
    setSelectedStockUID(uid);
    setSelectedStockPrice(price);
  };

  const handleCloseBuyWindow = () => {
    setActiveWindow(null);
    setSelectedStockUID("");
    setSelectedStockPrice(0);
  };

  const handleOpenSellWindow = (uid, price = 0) => {
    setActiveWindow("SELL");
    setSelectedStockUID(uid);
    setSelectedStockPrice(price);
  };

  const handleCloseSellWindow = () => {
    setActiveWindow(null);
    setSelectedStockUID("");
    setSelectedStockPrice(0);
  };

  const handleOpenChartWindow = (uid) => {
    setActiveWindow("CHART");
    setSelectedStockUID(uid);
  };

  const handleCloseChartWindow = () => {
    setActiveWindow(null);
    setSelectedStockUID("");
  };

  const handleOpenMoreWindow = (uid) => {
    setActiveWindow("MORE");
    setSelectedStockUID(uid);
  };

  const handleCloseMoreWindow = () => {
    setActiveWindow(null);
    setSelectedStockUID("");
  };

  return (
    <GeneralContext.Provider
      value={{
        openBuyWindow: handleOpenBuyWindow,
        closeBuyWindow: handleCloseBuyWindow,
        openSellWindow: handleOpenSellWindow,
        closeSellWindow: handleCloseSellWindow,
        openChartWindow: handleOpenChartWindow,
        closeChartWindow: handleCloseChartWindow,
        openMoreWindow: handleOpenMoreWindow,
        closeMoreWindow: handleCloseMoreWindow,
      }}
    >
      {props.children}
      {activeWindow === "BUY" && <BuyActionWindow uid={selectedStockUID} initialPrice={selectedStockPrice} closeBuyWindow={handleCloseBuyWindow} />}
      {activeWindow === "SELL" && <SellActionWindow uid={selectedStockUID} initialPrice={selectedStockPrice} closeSellWindow={handleCloseSellWindow} />}
      {activeWindow === "CHART" && <StockChart uid={selectedStockUID} closeChartWindow={handleCloseChartWindow} />}
      {activeWindow === "MORE" && <StockDetails uid={selectedStockUID} closeMoreWindow={handleCloseMoreWindow} />}
    </GeneralContext.Provider>
  );
};

export default GeneralContext;