import React, { useEffect } from 'react';
import Countdown from 'react-countdown';
import './index.scss';

import { paddingTwoDigits } from 'utils/convert';

interface Props {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const Time = (props: any) => {
  const renderer: React.FC<Props> = ({ days, hours, minutes, seconds }) => {
    return (
      <div id='js-clock' className='js-clock-2'>
        <div className='clock-time'>
          <span className='clock-number'>{paddingTwoDigits(days)}</span>
          <span className='clock-label'>days</span>
        </div>
        <div className='clock-time'>
          <span className='clock-number'>{paddingTwoDigits(hours)}</span>
          <span className='clock-label'>hours</span>
        </div>
        <div className='clock-time'>
          <span className='clock-number'>{paddingTwoDigits(minutes)}</span>
          <span className='clock-label'>min</span>
        </div>
        <div className='clock-time'>
          <span className='clock-number'>{paddingTwoDigits(seconds)}</span>
          <span className='clock-label'>sec</span>
        </div>
      </div>
    );
  };

  const { leftTimestamp } = props;
  useEffect(() => {
    // console.log('leftTimestamp', leftTimestamp);
  }, [leftTimestamp]);

  const deadline = leftTimestamp || Date.now() + 60000;

  return leftTimestamp ? (
    <Countdown date={deadline} renderer={renderer} />
  ) : (
    <div></div>
  );
};

export default Time;
