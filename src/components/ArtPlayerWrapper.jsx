import React, { useEffect, useRef } from 'react';
import Artplayer from 'artplayer';

export default function ArtPlayerWrapper({ option, getInstance, className, style }) {
    const artRef = useRef();

    useEffect(() => {
        const art = new Artplayer({
            ...option,
            container: artRef.current,
        });

        if (getInstance && typeof getInstance === 'function') {
            getInstance(art);
        }

        return () => {
            if (art && art.destroy) {
                art.destroy(false); // destroy instance
            }
        };
    }, []);

    return <div ref={artRef} className={className} style={style}></div>;
}
