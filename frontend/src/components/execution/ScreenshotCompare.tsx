import React from 'react';

interface Props {
  beforeUrl?: string;
  afterUrl?: string;
}

export const ScreenshotCompare: React.FC<Props> = ({ beforeUrl, afterUrl }) => {
  return (
    <div className="grid grid-cols-2 gap-4 mt-4">
      {beforeUrl && (
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">قبل</div>
          <img src={beforeUrl} alt="Before" className="w-full h-48 object-cover" />
        </div>
      )}
      {afterUrl && (
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">بعد</div>
          <img src={afterUrl} alt="After" className="w-full h-48 object-cover" />
        </div>
      )}
    </div>
  );
};
