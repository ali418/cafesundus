// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock the i18next library
jest.mock('react-i18next', () => ({
  // this mock makes sure any components using the translate hook can use it without a warning being shown
  useTranslation: () => {
    return {
      t: (str) => str,
      i18n: {
        changeLanguage: () => new Promise(() => {}),
        language: 'ar',
      },
    };
  },
  // Mock the Trans component
  Trans: ({ children }) => children,
  // Mock the withTranslation HOC
  withTranslation: () => (Component) => {
    Component.defaultProps = { ...Component.defaultProps, t: (str) => str };
    return Component;
  },
  // Mock the initReactI18next module
  initReactI18next: {
    type: '3rdParty',
    init: () => {},
  },
}));

// Mock the redux store
jest.mock('react-redux', () => ({
  useDispatch: () => jest.fn(),
  useSelector: jest.fn(),
  connect: () => jest.fn(),
}));

// Mock the react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useLocation: () => ({
    pathname: '/',
    search: '',
    hash: '',
    state: null,
    key: '5nvxpbdafa',
  }),
}));

// Mock the localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock the fetch API
global.fetch = jest.fn();