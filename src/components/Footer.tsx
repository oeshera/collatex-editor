import {
  DarkMode,
  GitHub,
  LightMode,
  OpenInNew,
  SettingsBrightness,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Container,
  Divider,
  Link,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { Link as RouterLink } from "@tanstack/react-router";
import { Theme, useThemeStore } from "../theme";

export default function Footer() {
  const muiTheme = useTheme();
  const sm = useMediaQuery(muiTheme.breakpoints.down("sm"));
  const theme = useThemeStore((state) => state.theme);
  const setTheme = useThemeStore((state) => state.setTheme);
  const handleTheme = (_: React.MouseEvent<HTMLElement>, newTheme: Theme) => {
    if (newTheme) {
      setTheme(newTheme);
    }
  };
  return (
    <Box sx={{ mt: "auto" }}>
      <Box
        sx={{
          width: "100%",
          mt: 4,
          pb: 1,
          backgroundColor: (theme) => theme.palette.secondary.main,
          color: (theme) => theme.palette.secondary.contrastText,
        }}
      >
        <Container
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 2,
            py: 2,
          }}
        >
          <Stack
            sx={{ px: 2 }}
            direction={sm ? "column" : "row"}
            alignItems={"center"}
            justifyContent={"space-between"}
            spacing={2}
          >
            <div>
              <Button
                variant="contained"
                component={Link}
                target="_blank"
                startIcon={<GitHub />}
                endIcon={<OpenInNew />}
                href="https://github.com/oeshera/collatex-editor"
              >
                Source
              </Button>
            </div>
            <Stack
              direction={sm ? "column" : "row"}
              spacing={2}
              divider={<Divider orientation="vertical" flexItem />}
              alignItems={"center"}
            >
              <Link component={RouterLink} underline="hover" to="/">
                Home
              </Link>
              <Link component={RouterLink} underline="hover" to="/doc">
                Documentation
              </Link>
              <Link component={RouterLink} underline="hover" to="/faq">
                FAQ
              </Link>
            </Stack>
            <div>
              <ToggleButtonGroup
                size="small"
                exclusive
                value={theme}
                onChange={handleTheme}
              >
                <Tooltip title="Dark Mode">
                  <ToggleButton value={Theme.DARK}>
                    <DarkMode />
                  </ToggleButton>
                </Tooltip>
                <Tooltip title="Device Default">
                  <ToggleButton value={Theme.DEVICE}>
                    <SettingsBrightness />
                  </ToggleButton>
                </Tooltip>
                <Tooltip title="Light Mode">
                  <ToggleButton value={Theme.LIGHT}>
                    <LightMode />
                  </ToggleButton>
                </Tooltip>
              </ToggleButtonGroup>
            </div>
          </Stack>
          <Divider />
          <Typography
            variant="body2"
            sx={{ width: "100%", textAlign: "center", px: 2 }}
          >
            CollateX Editor is made open source under a{" "}
            <Link
              target="_blank"
              underline="hover"
              href="https://creativecommons.org/licenses/by-nc-nd/4.0/deed.en"
            >
              Creative Commons Attribution-NonCommercial-NoDerivatives 4.0
              International License
            </Link>
            . The project was developed within the framework of a generous{" "}
            <Link
              target="_blank"
              underline="hover"
              href="https://www.mellon.org/grant-details/optical-character-recognition-of-arabic-texts:-phase-ii-20451385"
            >
              grant given by the Andrew W. Mellon Foundation
            </Link>{" "}
            to the{" "}
            <Link target="_blank" underline="hover" href="https://openiti.org/">
              Open Islamicate Texts Initiative
            </Link>{" "}
            at the University of Maryland.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}
