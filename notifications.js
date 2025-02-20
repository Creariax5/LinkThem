export function showNotification(message, isError = false, retryCallback = null) {
    const notification = document.createElement('div');
    
    // Style the notification
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: isError ? '#f44336' : '#4CAF50',
        color: 'white',
        padding: '15px',
        borderRadius: '5px',
        zIndex: '10000',
        boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
        minWidth: '200px',
        textAlign: 'center'
    });

    notification.textContent = message;

    // Add retry button for errors
    if (isError && retryCallback) {
        const retryButton = document.createElement('button');
        retryButton.textContent = 'Retry';
        
        Object.assign(retryButton.style, {
            marginLeft: '10px',
            padding: '5px 10px',
            border: 'none',
            borderRadius: '3px',
            backgroundColor: 'white',
            color: '#f44336',
            cursor: 'pointer'
        });
        
        retryButton.onclick = () => {
            notification.remove();
            retryCallback();
        };
        
        notification.appendChild(retryButton);
    }

    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), isError ? 10000 : 3000);
}

export function handleResponseStatus(response) {
    if (!response) {
        return {
            success: false,
            message: 'No response received from the server'
        };
    }

    if (response.success) {
        return {
            success: true,
            message: 'Job details successfully saved!'
        };
    } else {
        return {
            success: false,
            message: response.error || 'An unknown error occurred'
        };
    }
}