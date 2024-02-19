import React, { useState ,FC,useEffect} from 'react';


const Tooltip :FC<any> = ({ children, content }) => {
    const [isVisible, setIsVisible] = useState(false);

    const showTooltip = () => setIsVisible(true);
    const hideTooltip = () => setIsVisible(false);
    const [tooltipStyle, setTooltipStyle] = useState({
        position: 'absolute',
        bottom:'100%' ,
        left: '0',
        transform: 'translateX(8px)',
        backgroundColor: 'black',
        color: 'white',
        padding: '8px',
        borderRadius: '4px',
        whiteSpace: 'normal',
        zIndex: 10,
        opacity: 0.75,
        overflowWrap: 'break-word',
        wordWrap: 'break-word',
        width:'200px',
        maxWidth: '80vw', // Default maxWidth
      });


      useEffect(() => {
        // Dynamically adjust maxWidth based on screen width
        const updateTooltipMaxWidth = () => {
          const screenWidth = window.innerWidth;
          const width = screenWidth < 480 ? '80vw' : '30vw';
          setTooltipStyle(prevStyle => ({ ...prevStyle, width }));
        };
    
        window.addEventListener('resize', updateTooltipMaxWidth);
        updateTooltipMaxWidth(); // Initial adjustment
    
        return () => window.removeEventListener('resize', updateTooltipMaxWidth);
      }, []);
    return (
        <div style={{
            position: 'relative',
            display: 'inline-flex',
            alignItems: 'center',
           
        }
        } onMouseEnter={showTooltip} onMouseLeave={hideTooltip}>
            {children}
            {isVisible && (
                //@ts-ignore
                <div style={tooltipStyle} >
                    {content}
                </div>
            )}
        </div>
    );
};

export default Tooltip;