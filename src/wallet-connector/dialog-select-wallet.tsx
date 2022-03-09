import Avatar from '@mui/material/Avatar';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import DialogTitle from '@mui/material/DialogTitle';
import Dialog from '@mui/material/Dialog';
import { WalletConnectorContext } from './context';
import { toCamelCase, toKey } from './utilities';

const supportedWallets = ['MetaMask', 'WalletConnect'];

export function WalletConnectorDialog(props: { onClose: (_connectType: string) => void }) {
  const images = {
    metaMask: 'https://assets.duelistking.com/metamask.png',
    walletConnect: 'https://assets.duelistking.com/walletconnect.png',
  };

  return (
    <WalletConnectorContext.Consumer>
      {({ dialogOpen }) => (
        <Dialog onClose={props.onClose} open={dialogOpen} style={{ zIndex: '99999' }}>
          <DialogTitle>Choose supported wallet</DialogTitle>
          <List sx={{ pt: 0 }}>
            {supportedWallets.map((item) => (
              <ListItem button onClick={() => props.onClose(toKey(item))} key={toKey(item)}>
                <ListItemAvatar>
                  <Avatar src={images[toCamelCase(item)]} />
                </ListItemAvatar>
                <ListItemText primary={item} />
              </ListItem>
            ))}
          </List>
        </Dialog>
      )}
    </WalletConnectorContext.Consumer>
  );
}

export default WalletConnectorDialog;
