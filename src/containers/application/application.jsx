import React, { useEffect, useState, useRef, useContext } from 'react';
import { connect } from 'react-redux';
import {
  Navigation,
  AppSideBar,
  NavigationLeft,
  Pane,
} from '@cybercongress/gravity';
import { Link, useHistory, useLocation } from 'react-router-dom';
import queryString from 'query-string';
import Menu from './ToggleMenu';
import AppMenu from './AppMenu';
import { MenuButton, BandwidthBar, Tooltip } from '../../components';
import Electricity from '../home/electricity';
import { getAccountBandwidth } from '../../utils/search/utils';
import { setBandwidth } from '../../redux/actions/bandwidth';
import { setDefaultAccount, setAccounts } from '../../redux/actions/pocket';
import { setQuery } from '../../redux/actions/query';
import { CYBER, WP } from '../../utils/config';
import {
  formatNumber,
  convertResources,
  coinDecimals,
  reduceBalances,
} from '../../utils/utils';
import { AppContext } from '../../context';
import LeftTooltip from './leftTooltip';

const cyber = require('../../image/large-green.png');
const cybFalse = require('../../image/cyb.svg');
const cybTrue = require('../../image/cybTrue.svg');
const bug = require('../../image/alert-circle-outline.svg');
const circleRed = require('../../image/large-red-circle.png');

const ListAccounts = ({
  accounts,
  defaultAccount,
  children,
  onClickChangeActiveAcc,
}) => {
  let items = {};
  if (accounts && accounts !== null) {
    items = Object.keys(accounts).map((key, i) => {
      let active = false;
      if (
        defaultAccount &&
        defaultAccount.name &&
        defaultAccount.name === key
      ) {
        active = true;
      }
      return (
        <Pane
          key={`${key}_${i}`}
          paddingX={10}
          paddingY={5}
          color={active ? '#ff9100' : '#fff'}
          onClick={() =>
            active ? '' : onClickChangeActiveAcc(key, accounts[key])
          }
          className={active ? '' : 'account-popaps'}
        >
          {key}
        </Pane>
      );
    });
  }
  return (
    <Tooltip
      placement="bottom"
      trigger={['click', 'hover']}
      tooltip={
        Object.keys(items).length > 0
          ? items
          : "you don't have accounts in your pocket"
      }
    >
      <Pane>{children}</Pane>
    </Tooltip>
  );
};

function App({
  defaultAccount,
  query,
  ipfsStatus,
  bandwidth,
  accounts,
  setQueryProps,
  setAccountsProps,
  setDefaultAccountProps,
  setBandwidthProps,
  children,
}) {
  const { jsCyber } = useContext(AppContext);
  const textInput = useRef();
  const history = useHistory();
  const location = useLocation();
  const [home, setHome] = useState(false);
  const [openMenu, setOpenMenu] = useState(true);
  const [countLink, setCountLink] = useState(0);
  const [priceLink, setPriceLink] = useState(0.25);
  const [amounPower, setAmounPower] = useState(0);
  let story = false;
  const localStorageStory = localStorage.getItem('story');
  if (localStorageStory !== null) {
    story = localStorageStory;
  }

  useEffect(() => {
    const { pathname } = location;
    if (pathname.indexOf(query) === -1) {
      setQueryProps('');
    }
  }, [location.pathname]);

  useEffect(() => {
    const getPrice = async () => {
      if (jsCyber !== null) {
        const response = await jsCyber.price();
        setPriceLink(coinDecimals(response.price.dec));
      }
    };
    getPrice();
  }, [jsCyber]);

  useEffect(() => {
    const checkAddressLocalStorage = async () => {
      const { account } = defaultAccount;
      // console.log(`!!! ===> 96 useEffect checkAddressLocalStorage`, account);
      if (account === null) {
        let defaultAccounts = null;
        let defaultAccountsKeys = null;
        let accountsTemp = null;

        const localStoragePocketAccount = await localStorage.getItem(
          'pocketAccount'
        );
        const localStoragePocket = localStorage.getItem('pocket');
        if (localStoragePocket !== null) {
          const localStoragePocketData = JSON.parse(localStoragePocket);
          const keyPocket = Object.keys(localStoragePocketData)[0];
          const accountPocket = Object.values(localStoragePocketData)[0];
          defaultAccounts = accountPocket;
          defaultAccountsKeys = keyPocket;
        }
        if (localStoragePocketAccount !== null) {
          const localStoragePocketAccountData = JSON.parse(
            localStoragePocketAccount
          );
          if (localStoragePocket === null) {
            const keys0 = Object.keys(localStoragePocketAccountData)[0];
            localStorage.setItem(
              'pocket',
              JSON.stringify({ [keys0]: localStoragePocketAccountData[keys0] })
            );
            defaultAccounts = localStoragePocketAccountData[keys0];
            defaultAccountsKeys = keys0;
          } else {
            accountsTemp = {
              [defaultAccountsKeys]:
                localStoragePocketAccountData[defaultAccountsKeys],
              ...localStoragePocketAccountData,
            };
          }
        } else {
          localStorage.clear();
        }
        setDefaultAccountProps(defaultAccountsKeys, defaultAccounts);
        setAccountsProps(accountsTemp);
      }
    };
    checkAddressLocalStorage();
  }, []);

  useEffect(() => {
    const getBandwidth = async () => {
      try {
        const { account } = defaultAccount;
        if (
          account !== null &&
          Object.prototype.hasOwnProperty.call(account, 'cyber')
        ) {
          const response = await jsCyber.account(account.cyber.bech32);
          const { remainedValue, maxValue } = response.accountBandwidth;
          setBandwidthProps(remainedValue, maxValue);
          setCountLink(remainedValue / (priceLink * 1000));
        } else {
          setBandwidthProps(0, 0);
          setCountLink(0);
        }
      } catch (error) {
        setBandwidthProps(0, 0);
        setCountLink(0);
      }
    };
    getBandwidth();
  }, [defaultAccount, location.pathname, priceLink, jsCyber]);

  useEffect(() => {
    const getAmounPower = async () => {
      try {
        const { account } = defaultAccount;
        if (
          account !== null &&
          Object.prototype.hasOwnProperty.call(account, 'cyber') &&
          jsCyber !== null
        ) {
          const { bech32 } = account.cyber;
          const allBalances = await jsCyber.getAllBalances(bech32);
          const reduceallBalances = reduceBalances(allBalances);
          if (reduceallBalances.milliampere && reduceallBalances.millivolt) {
            const { milliampere, millivolt } = reduceallBalances;
            setAmounPower(
              convertResources(milliampere) * convertResources(millivolt)
            );
          }
        } else {
          setAmounPower(0);
        }
      } catch (error) {
        setAmounPower(0);
      }
    };
    getAmounPower();
  }, [jsCyber, defaultAccount]);

  // chekEvangelism = () => {
  //   const { location } = this.props;
  //   const { search } = location;

  //   if (search.match(/thanks=/gm) && search.match(/thanks=/gm).length > 0) {
  //     const parsed = queryString.parse(search);
  //     console.log('parsed', parsed);
  //     localStorage.setItem('thanks', JSON.stringify(parsed.thanks));
  //   }
  // };

  const onChangeInput = async (e) => {
    const { value } = e.target;

    if (query.length === 0 && value === '/') {
      setQueryProps('');
    } else {
      setQueryProps(value);
    }
  };

  const handleKeyPress = async (e) => {
    if (query.length > 0) {
      if (e.key === 'Enter') {
        history.push(`/search/${query}`);
        setQueryProps(query);
      }
    }
  };

  const onClickChangeActiveAcc = async (key) => {
    if (
      accounts !== null &&
      Object.prototype.hasOwnProperty.call(accounts, key)
    ) {
      const defaultAccountTemp = { [key]: accounts[key] };
      const accountsPocket = {
        [key]: accounts[key],
        ...accounts,
      };
      setDefaultAccountProps(key, accounts[key]);
      setAccountsProps(accountsPocket);
      localStorage.setItem('pocket', JSON.stringify(defaultAccountTemp));
    }
  };

  // if (!story) {
  //   return <div>{children}</div>;
  // }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          position: 'relative',
          padding: 0,
        }}
        className="container-distribution"
      >
        <Pane position="relative">
          <AppSideBar
            onCloseSidebar={() => setOpenMenu(false)}
            openMenu={openMenu}
          >
            <AppMenu />
          </AppSideBar>
          <MenuButton onClick={() => setOpenMenu(!openMenu)} imgLogo={cyber} />
          <Pane bottom="-10px" right="-20%" position="absolute">
            <LeftTooltip />
          </Pane>
        </Pane>
        <Pane
          className="battery-container"
          width="65px"
          position="absolute"
          left="60px"
        >
          <BandwidthBar
            height="15px"
            styleText={{ whiteSpace: 'nowrap' }}
            fontSize={12}
            colorText="#000"
            bwRemained={bandwidth.remained}
            bwMaxValue={bandwidth.maxValue}
            countLink={countLink}
            amounPower={amounPower}
          />
        </Pane>
        {!home && (
          <Pane
            position="absolute"
            left="50%"
            transform="translate(-50%, 0)"
            marginRight="-50%"
            zIndex={1}
            backgroundColor="#000"
            borderRadius={20}
            width="60%"
            // className="box-shadow-input"
            height="100%"
          >
            <input
              onChange={(e) => onChangeInput(e)}
              onKeyPress={handleKeyPress}
              className="search-input"
              ref={textInput}
              value={query}
              autoComplete="off"
              id="search-input-searchBar"
              style={{
                width: '100%',
                height: 41,
                fontSize: 20,
                textAlign: 'center',
                position: 'absolute',
                top: '50%',
                transform: 'translate(0, -50%)',
                zIndex: 1,
                backgroundColor: '#000',
              }}
            />
          </Pane>
        )}
        <Electricity />
        {defaultAccount.name !== null && (
          <Pane
            className="battery-container"
            width="fit-content"
            position="absolute"
            right="60px"
            whiteSpace="nowrap"
            fontSize="14px"
            backgroundColor="#000"
            boxShadow="0 0 5px 5px #000"
          >
            <ListAccounts
              accounts={accounts}
              onClickChangeActiveAcc={onClickChangeActiveAcc}
              defaultAccount={defaultAccount}
            >
              {defaultAccount.name}
            </ListAccounts>
          </Pane>
        )}
        <Pane position="relative">
          <MenuButton
            to="/"
            imgLogo={ipfsStatus ? cybTrue : cybFalse}
            positionBugLeft
          />
          <Pane bottom="-10px" left="-20%" position="absolute">
            <Tooltip
              placement="bottom"
              tooltip={
                <span>
                  <a
                    target="_blank"
                    rel="noopener noreferrer"
                    href="https://github.com/cybercongress/dot-cyber"
                  >
                    The dot-cyber
                  </a>{' '}
                  app has not been audited yet. Please, use it with caution.
                </span>
              }
            >
              <img
                alt="bugs"
                style={{ width: '20px', height: '20px' }}
                src={circleRed}
              />
            </Tooltip>
          </Pane>
        </Pane>
      </div>
      {/* </Navigation> */}
      {children}
    </div>
  );
}

const mapStateToProps = (store) => {
  return {
    ipfsStatus: store.ipfs.statusIpfs,
    bandwidth: store.bandwidth.bandwidth,
    query: store.query.query,
    mobile: store.settings.mobile,
    defaultAccount: store.pocket.defaultAccount,
    accounts: store.pocket.accounts,
  };
};

const mapDispatchprops = (dispatch) => {
  return {
    setBandwidthProps: (remained, maxValue) =>
      dispatch(setBandwidth(remained, maxValue)),
    setQueryProps: (query) => dispatch(setQuery(query)),
    setDefaultAccountProps: (name, account) =>
      dispatch(setDefaultAccount(name, account)),
    setAccountsProps: (accounts) => dispatch(setAccounts(accounts)),
  };
};

export default connect(mapStateToProps, mapDispatchprops)(App);
