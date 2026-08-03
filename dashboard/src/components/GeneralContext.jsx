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

  const handleOpenBuyWindow = (uid) => {
    setActiveWindow("BUY");
    setSelectedStockUID(uid);
  };

  const handleCloseBuyWindow = () => {
    setActiveWindow(null);
    setSelectedStockUID("");
  };

  const handleOpenSellWindow = (uid) => {
    setActiveWindow("SELL");
    setSelectedStockUID(uid);
  };

  const handleCloseSellWindow = () => {
    setActiveWindow(null);
    setSelectedStockUID("");
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
      {activeWindow === "BUY" && <BuyActionWindow uid={selectedStockUID} closeBuyWindow={handleCloseBuyWindow} />}
      {activeWindow === "SELL" && <SellActionWindow uid={selectedStockUID} closeSellWindow={handleCloseSellWindow} />}
      {activeWindow === "CHART" && <StockChart uid={selectedStockUID} closeChartWindow={handleCloseChartWindow} />}
      {activeWindow === "MORE" && <StockDetails uid={selectedStockUID} closeMoreWindow={handleCloseMoreWindow} />}
    </GeneralContext.Provider>
  );
};

export default GeneralContext;