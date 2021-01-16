import * as React from 'react';
import styled from 'styled-components';
import * as signalR from '@microsoft/signalr';
import { ChatClient } from 'twitch-chat-client';
import { StaticAuthProvider } from 'twitch-auth';
import { Bag, BagItem, TwitchData } from '../Models';
import TwitchMessageList, { TwitchMessage } from './TwitchMessageList';

interface Props {
    hub: signalR.HubConnection;
    bag: Bag;

    onAddItem: (item: BagItem) => void;
    onClose: () => void;
}

declare global {
    namespace twitchEmoji {
        export function parse(text: string, options?: any): string;
    }
}

const FlightBagMSFS = (props: Props) => {
    const [showCode, setShowCode] = React.useState(false);

    const [selectedItem, setSelectedItem] = React.useState<BagItem | null>(null);

    const [iframeTitle, setIframeTitle] = React.useState('');
    const [iframeSrc, setIframeSrc] = React.useState('');

    const [twitchOAuthToken, setTwitchOAuthToken] = React.useState('');
    const [twitchChannel, setTwitchChannel] = React.useState('');

    const [twitchMessages, setTwitchMessages] = React.useState<TwitchMessage[]>([]);

    const handleItemClick = (item: BagItem) => {
        setSelectedItem(item);
        switch (item.type) {
            case 'URL':
                setIframeTitle(`[${item.type}] ${item.title}: ${item.data as string}`);
                setIframeSrc(item.data as string);
                break;
            case 'Image':
                setIframeTitle(`[${item.type}] ${item.title}`);
                setIframeSrc(item.data as string);
                break;
            case 'Twitch':
                const twitchData = item.data as TwitchData;
                setTwitchOAuthToken(twitchData.oauthToken);
                setTwitchChannel(twitchData.channel);
                break;
        }
    }

    React.useEffect(() => {
        if (twitchOAuthToken) {
            const f = async () => {
                const authProvider = new StaticAuthProvider('2a29t3dlfov5mqozz2b8biy8oqxs13', twitchOAuthToken);
                const chatClient = new ChatClient(authProvider, { channels: [twitchChannel] });

                chatClient.onMessage((channel, user, message, msg) => {
                    const parsed = twitchEmoji.parse(msg.message.value, { emojiSize : 'small' });

                    setTwitchMessages(messages => messages.concat({
                        id: msg.id,
                        author: msg.userInfo.displayName,
                        message: msg.message.value,
                        htmlMessage: parsed,
                        rawLine: msg.rawLine
                    }));
                });
                await chatClient.connect();
            };
            f();
        }
    }, [twitchOAuthToken, twitchChannel]);

    return <StyledContainer>
        <div>
            <h3>
                Flight Bag <em onClick={() => setShowCode(!showCode)}>[{!showCode ? "Show code" : props.bag.id}]</em>
                <StyledCloseButton onClick={props.onClose}>Close</StyledCloseButton>
            </h3>
            {props.bag.items.length === 0 ?
                <p>Your flight bag is empty. Open <strong>flightbag.flighttracker.tech</strong> to add items to the bag.</p> :
                <StyledList>
                    {props.bag.items.map(item => <StyledListItem key={item.title}>
                        <StyledListButton onClick={() => handleItemClick(item)}>{item.title}</StyledListButton>
                    </StyledListItem>)}
                </StyledList>}
        </div>

        {selectedItem && <Display type={selectedItem.type} iframeSrc={iframeSrc} iframeTitle={iframeTitle} messages={twitchMessages} />}
    </StyledContainer>
}

interface DisplayProps {
    type: string;
    iframeSrc: string;
    iframeTitle: string;
    messages: TwitchMessage[];
}

const Display = (props: DisplayProps) => {
    switch (props.type) {
        case "URL":
        case "Image":
            return !!props.iframeSrc ? <>
                <StyledFrameTitle>{props.iframeTitle}</StyledFrameTitle>
                <iframe src={props.iframeSrc} title={props.iframeTitle}></iframe>
            </> : null;
        case "Twitch":
            return <TwitchMessageList messages={props.messages} />
        default:
            return null;
    }
}

const StyledContainer = styled.div`
display: grid;
height: 100%;
color: white;
align-items: stretch;
grid-template-rows: min-content min-content auto;

h3 {
    padding-left: 5px;
    padding: 10px;
    margin: 0;
    background-color: rgba(0,0,0,0.2);
}

iframe {
    border: none;
    margin: 0;
    padding: 0;
    width: 100%;
}
`

const StyledList = styled.ul`
list-style: none;
padding: 0;
margin: 0;
`

const StyledListItem = styled.li`
display: inline-block;
padding: 0;
margin: 0 3px 0 0;
`

const StyledButton = styled.button`
background-color: #00b4ff;
color: white;
border: none;
margin: 0;

:hover {
    background-color: white;
    color: #00b4ff;
}
`

const StyledListButton = styled(StyledButton)`
font-size: 1.5em;
padding: 5px 10px;
`

const StyledCloseButton = styled(StyledButton)`
position: absolute;
right: 10px;
`

const StyledFrameTitle = styled.div`
background-color: rgba(0,0,0,0.2);
font-size: 1.2em;
padding: 10px;
`

export default FlightBagMSFS;