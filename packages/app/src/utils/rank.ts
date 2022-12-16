import BigInt from 'big-integer';

export const getNextRank = (rank = '0x888') => {
  const nextRank = '0x' + BigInt(rank).add(BigInt(1)).toString(16);
  return nextRank;
};

export const getPrevRank = (rank = '0x888') => {
  const nextRank = '0x' + BigInt(rank).minus(BigInt(1)).toString(16);
  return nextRank;
};

export const getSeed = (rowCount: number) => {
  return '0x' + '8'.repeat(rowCount.toString(16).length + 4);
};

export const getRankBetween = (
  prevRank?: string,
  nextRank?: string
): string => {
  if (!prevRank) {
    return getPrevRank(nextRank);
  }
  if (!nextRank) {
    return getNextRank(prevRank);
  }
  if (nextRank.length > prevRank.length) {
    return getPrevRank(nextRank);
  }
  const newRank = getNextRank(prevRank);
  if (newRank === nextRank) {
    return newRank + '8';
  } else {
    return newRank;
  }
};
