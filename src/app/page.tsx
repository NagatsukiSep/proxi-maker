"use client";

import { useState } from "react";
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

  const extractName = (src: string) => {
    const fileName = src.split('/').pop()
    const romajiPart = fileName?.split('_')?.pop()?.replace('.jpg', '');
    return romajiPart ? romajiPart : "";
  }

  const [newCard, setNewCard] = useState({ src: "", name: "", count: 1, id: "", isSelected: true } as Card);

  const addNewCard = () => {
    newCard.id = uuidv4();
    newCard.name = extractName(newCard.src);
    setDeckData(prev => [...prev, newCard]);
    setNewCard({ src: "", name: "", count: 1, id: "", isSelected: true });
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
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-8 bg-pink-50">
      <h1 className="text-3xl sm:text-5xl font-extrabold text-pink-600 mb-8 text-center">プロキシメーカー</h1>

      <div className="mb-6 w-full sm:w-auto">
        <input
          type="text"
          value={deckCode}
          onChange={e => setDeckCode(e.target.value)}
          className="p-2 rounded-lg border-2 border-pink-300 focus:border-pink-500 outline-none shadow-md w-full sm:w-72"
          placeholder="デッキコードを入力"
        />
      </div>

      <div className="mb-8 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
        <button
          onClick={async () => {
            setLoading(true);
            const response = await fetch(`/api/getDeckData?code=${deckCode}`);
            const data: Card[] = await response.json();
            data.forEach(addDeckData);
            setLoading(false);
          }}
          className="px-6 py-2 bg-pink-500 text-white font-semibold rounded-lg shadow-md hover:bg-pink-600 transition-colors duration-300 w-full sm:w-auto"
        >
          反映
        </button>

        <button
          onClick={handleDownload}
          className="px-6 py-2 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-600 transition-colors duration-300 w-full sm:w-auto"
        >
          PDFにしてダウンロード
        </button>
      </div>

      {loading && <p className="text-pink-600 font-semibold">Loading...</p>}
      {!loading && deckData.length === 0 && <p className="text-pink-600 font-semibold">No data</p>}

      {!loading && deckData.length > 0 && (
        <div className="w-full overflow-x-auto">
          <table className="w-full border-collapse bg-white rounded-lg shadow-lg overflow-hidden">
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
                    <div className="w-[100px] h-[58px] overflow-hidden relative rounded-lg mx-auto">
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
              <tr className="even:bg-pink-100 odd:bg-pink-50 text-pink-800">
                <td className="p-4"><img src="https://placehold.jp/28/fbcfe8/9d174d/100x58.png?text=?" className="rounded-lg shadow-md mx-auto" /></td>
                <td className="p-4">
                  <input
                    type="text"
                    value={newCard.src}
                    onChange={e => setNewCard({ ...newCard, src: e.target.value })}
                    className="p-2 rounded-lg border-2 border-pink-300 focus:border-pink-500 outline-none shadow-md w-full"
                    placeholder="画像urlを入力"
                  />
                </td>
                <td className="p-4"></td>
                <td className="p-4">
                  <button
                    onClick={addNewCard}
                    className="bg-pink-500 text-white font-semibold rounded-lg shadow-md hover:bg-pink-600 transition-colors duration-300 px-4 py-2 w-full sm:w-auto"
                  >
                    追加
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
