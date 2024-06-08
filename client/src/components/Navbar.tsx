import { useContext } from 'react';
import TimeAgo from 'react-timeago-i18n';
import { Link, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  Button,
  Container,
  IconButton,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';
import GitHubIcon from '@mui/icons-material/GitHub';
import HelpIcon from '@mui/icons-material/Help';
import { DataContext } from '../context';

const pages = {
  '/': 'Home',
  '/other': 'Other Diagnostics',
  '/warnings': 'Warnings',
  '/layers': 'Layers',
};

export const Navbar: React.FC = () => {
  const { pathname } = useLocation();

  const data = useContext(DataContext);

  return (
    <AppBar position="static" style={{ height: 69 }}>
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <Typography
              variant="h6"
              noWrap
              component={Link}
              to="/"
              sx={{
                marginRight: 2,
                fontWeight: 700,
                color: 'inherit',
                textDecoration: 'none',
                lineHeight: '20px',
              }}
            >
              Place Name Conflation
            </Typography>
            <small style={{ fontSize: 12 }}>
              Last updated <TimeAgo date={data.lastUpdated} />
            </small>
          </div>
          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
            {Object.entries(pages).map(([path, pageName]) => (
              <Button
                key={path}
                sx={{
                  my: 2,
                  color: 'white',
                  display: 'block',
                  textTransform: 'capitalize',
                  textDecoration: path === pathname ? 'underline' : 'none',
                }}
                component={Link}
                to={path}
              >
                {pageName}
              </Button>
            ))}
          </Box>

          {/* right side */}
          <Box sx={{ flexGrow: 0 }}>
            <Tooltip title="View on GitHub">
              <IconButton
                component="a"
                href="https://github.com/osm-nz/place-name-conflation"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'white' }}
              >
                <GitHubIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="View wiki page">
              <IconButton
                component="a"
                href="https://osm.wiki/Import/New_Zealand_Place_Names"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'white' }}
              >
                <HelpIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};
