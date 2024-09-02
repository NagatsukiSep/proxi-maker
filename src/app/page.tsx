"use client";

import { useEffect, useState } from "react";
import { v4 as uuidv4 } from 'uuid';

export interface Card {
  src: string;
  name: string;
  count: number;
  id: string;
  isSelected: boolean;
}


export default function Home() {
  const [deckCode, setDeckCode] = useState("");
  const [deckData, setDeckData] = useState([] as Card[]);
  const addDeckData = (card: Card) => {
    card.id = uuidv4();
    card.isSelected = true;
    setDeckData(prev => [...prev, card]);
  }
  const addCardCount = (uuid: string, op: string) => {
    const newDeckData = deckData.map(card => {
      if (card.id === uuid) {
        switch (op) {
          case "add":
            card.count++;
            break;
          case "sub":
            card.count--;
            break;
        }
      }
      return card;
    });
    setDeckData(newDeckData);
  }
  const checkCard = (uuid: string) => {
    const newDeckData = deckData.map(card => {
      if (card.id === uuid) {
        card.isSelected = !card.isSelected;
      }
      return card;
    });
    setDeckData(newDeckData);
  }
  const [isAllChecked, setIsAllChecked] = useState(false);
  const checkAll = () => {
    const newDeckData = deckData.map(card => {
      card.isSelected = !isAllChecked;
      return card;
    });
    setDeckData(newDeckData);
    setIsAllChecked(!isAllChecked);
  }


  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    try {
      const selectedCards = deckData.filter(card => card.isSelected);
      if (selectedCards.length === 0) {
        alert("Please select at least one card.");
        return;
      }
      const response = await fetch('/api/generatePDF', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(selectedCards),
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'generated.pdf';
      a.click();
    } catch (e) {
      console.error(e);
    }

    // const response = await fetch('/api/generatePDF');

  };

  return (
    <main className="flex min-h-screen flex-col items-center p-8 bg-pink-50">
      <h1 className="text-5xl font-extrabold text-pink-600 mb-8">プロキシメーカー</h1>

      <div className="mb-6">
        <input
          type="text"
          value={deckCode}
          onChange={e => setDeckCode(e.target.value)}
          className="p-2 rounded-lg border-2 border-pink-300 focus:border-pink-500 outline-none shadow-md w-72"
          placeholder="デッキコードを入力"
        />
      </div>

      <div className="mb-8 flex space-x-4">
        <button
          onClick={async () => {
            setLoading(true);
            const response = await fetch(`/api/getDeckData?code=${deckCode}`);
            const data: Card[] = await response.json();
            data.forEach(addDeckData);
            setLoading(false);
          }}
          className="px-6 py-2 bg-pink-500 text-white font-semibold rounded-lg shadow-md hover:bg-pink-600 transition-colors duration-300"
        >
          反映
        </button>

        <button
          onClick={handleDownload}
          className="px-6 py-2 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-600 transition-colors duration-300"
        >
          PDFにしてダウンロード
        </button>
      </div>

      {loading && <p className="text-pink-600 font-semibold">Loading...</p>}
      {!loading && deckData.length === 0 && <p className="text-pink-600 font-semibold">No data</p>}

      {!loading && deckData.length > 0 && (
        <table className="border-collapse bg-white rounded-lg shadow-lg overflow-hidden">
          <thead>
            <tr className="bg-pink-200 text-pink-800">
              <th className="p-4">カード</th>
              <th className="p-4">カード名</th>
              <th className="p-4">枚数</th>
              <th className="p-4">
                選択<br />
                <button
                  onClick={() => checkAll()}
                  className="text-pink-600 hover:underline"
                >
                  全選択(解除)
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {deckData.map((card, index) => (
              <tr key={index} className="even:bg-pink-100 odd:bg-pink-50">
                <td className="p-4">
                  <div className="w-[100px] h-[58px] overflow-hidden relative rounded-lg">
                    <img src={card.src} alt={card.name} className="absolute w-full rounded-lg shadow-md -top-[11px]" />
                  </div>
                </td>
                <td className="p-4 text-center">{card.name}</td>
                <td className="p-4 text-center">
                  {card.count}
                  <button onClick={() => addCardCount(card.id, "add")} className="ml-2 bg-pink-300 text-pink-800 rounded-full px-2 py-1 text-xs font-bold">+</button>
                  <button onClick={() => addCardCount(card.id, "sub")} className="ml-2 bg-pink-300 text-pink-800 rounded-full px-2 py-1 text-xs font-bold">-</button>
                </td>
                <td className="p-4 text-center">
                  <input
                    type="checkbox"
                    checked={card.isSelected}
                    onChange={() => checkCard(card.id)}
                    className="h-5 w-5 text-pink-600 rounded border-pink-300 focus:ring-pink-500"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>

    // <main className="flex min-h-screen flex-col items-center p-24">
    //   <h1 className="text-4xl font-bold">プロキシメーカー</h1>

    //   <input type="text" value={deckCode} onChange={e => setDeckCode(e.target.value)} />
    //   <button onClick={async () => {
    //     setLoading(true);
    //     const response = await fetch(`/api/getDeckData?code=${deckCode}`);
    //     const data: Card[] = await response.json();
    //     data.forEach(addDeckData);
    //     setLoading(false);
    //   }}>反映</button>

    //   <button onClick={handleDownload}>PDFにしてダウンロード</button>


    //   {loading && <p>Loading...</p>}
    //   {!loading && deckData.length === 0 && <p>No data</p>}
    //   {!loading && deckData.length > 0 && (
    //     <table border={1} cellPadding="10" cellSpacing="0">
    //       <thead>
    //         <tr>
    //           <th>カード</th>
    //           <th>カード名</th>
    //           <th>枚数</th>
    //           <th>選択<br /><button onClick={() => checkAll()}>全選択(解除)</button></th>
    //         </tr>
    //       </thead>
    //       <tbody>
    //         {deckData.map((card, index) => (
    //           <tr key={index}>
    //             <td><div className="w-[100px] h-[50px] overflow-hidden relative rounded-lg">
    //               <img src={card.src} alt={card.name} className="w-full relative" />
    //             </div></td>
    //             <td>{card.name}</td>
    //             <td>{card.count}<button onClick={() => addCardCount(card.id, "add")}>+</button><button onClick={() => addCardCount(card.id, "sub")}>-</button></td>
    //             <td><input type="checkbox" checked={card.isSelected} onChange={() => checkCard(card.id)} /></td>
    //           </tr>
    //         ))}
    //       </tbody>
    //     </table>
    //   )}
    // </main>
  );
}
