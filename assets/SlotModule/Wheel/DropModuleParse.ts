/**
 * DropModule 的「Server JSON 解析」拆檔。
 *
 * 把 getClearSymbol / getBingoSymbol / getResultWheel 三個 pure 解析
 * function 拆出,純粹為了控制單檔行數;不需 host instance。
 */

/**
 * 整理Server給的資料,把每個bingo資料整成一份要消失的位置
 * @param comboData 一個Combo的資料
 * @returns 要消失的位置資料
 */
export function getClearSymbolImpl(comboData: JSON): number[][] {
  const clearAry: number[][] = [];

  if (!comboData.hasOwnProperty('Bingo')) {
    console.error('no Bingo');
    return clearAry;
  }
  const bingoAry: JSON[] = comboData['Bingo'];
  console.log('bingo數量:' + bingoAry.length);

  if (!bingoAry[0].hasOwnProperty('pos')) {
    console.error('no Pos');
    return clearAry;
  }

  if (!comboData.hasOwnProperty('BonusPos')) {
    console.error('no Bonus');
  }

  const posList: number[][] = comboData['Bingo'][0]['pos'];
  const bonusPosList: number[][] = comboData['BonusPos'];
  const flag: boolean = bonusPosList.length === 0;
  for (let i = 0; i < posList.length; i++) {
    const pushArr: number[] = [];
    for (let j = 0; j < posList[i].length; j++) {
      pushArr.push(0);
    }
    clearAry.push(pushArr);
    if (flag) {
      bonusPosList.push(pushArr);
    }
  }

  for (let count = 0; count < bingoAry.length; count++) {
    const bingoPos: number[][] = bingoAry[count]['pos'];
    for (let i = 0; i < clearAry.length; i++) {
      for (let j = 0; j < clearAry[i].length; j++) {
        clearAry[i][j] = clearAry[i][j] || bingoPos[i][j] || bonusPosList[i][j];
      }
    }
  }
  return clearAry;
}

/**
 * 整理Server給的資料,把每個bingo資料整成一份要消失的位置 不包含bonus的位置
 */
export function getBingoSymbolImpl(comboData: JSON): number[][] {
  const resultAry: number[][] = [];

  if (!comboData.hasOwnProperty('Bingo')) {
    console.error('no Bingo');
    return resultAry;
  }
  const bingoAry: JSON[] = comboData['Bingo'];
  console.log('bingo數量:' + bingoAry.length);

  if (!bingoAry[0].hasOwnProperty('pos')) {
    console.error('no Pos');
    return resultAry;
  }

  if (!comboData.hasOwnProperty('BonusPos')) {
    console.error('no Bonus');
  }

  const posList: number[][] = comboData['Bingo'][0]['pos'];
  for (let i = 0; i < posList.length; i++) {
    const pushArr: number[] = [];
    for (let j = 0; j < posList[i].length; j++) {
      pushArr.push(0);
    }
    resultAry.push(pushArr);
  }

  for (let count = 0; count < bingoAry.length; count++) {
    const bingoPos: number[][] = bingoAry[count]['pos'];
    for (let i = 0; i < resultAry.length; i++) {
      for (let j = 0; j < resultAry[i].length; j++) {
        resultAry[i][j] = resultAry[i][j] || bingoPos[i][j];
      }
    }
  }
  return resultAry;
}

/**
 * 取得此combo消去後的盤面
 */
export function getResultWheelImpl(comboData: JSON): number[][] {
  const resultAry: number[][] = [];

  if (!comboData.hasOwnProperty('FallWheel')) {
    console.log('no Fall Wheels');
    return resultAry;
  }
  const resultDatas: JSON = comboData['FallWheel'];
  let keyIndex = 0;
  for (let i = 0, count = Object.keys(resultDatas).length; i < count; ) {
    const keyStr = '' + keyIndex;
    if (resultDatas.hasOwnProperty(keyStr)) {
      const ary: number[] = resultDatas[keyStr];
      resultAry.push(ary);
      keyIndex++;
    }
    i++;
  }
  console.log(resultAry);
  return resultAry;
}
