import assert from 'assert';
// @ts-ignore
import * as getFunctionArguments from 'fn-args';
import { ClientFunction, RequestHook, t } from 'testcafe';

const getPageUrl = () => ClientFunction(() => document.location.href);

const getHtmlSource = () =>
  ClientFunction(() => document.getElementsByTagName('html')[0].innerHTML);

async function waitForFunction(browserFn: any, waitTimeout: number) {
  const pause = () => new Promise((resolve) => setTimeout(resolve, 50));

  const start = Date.now();
  // eslint-disable-next-line no-constant-condition
  while (true) {
    let result;
    try {
      result = await browserFn();
      // eslint-disable-next-line no-empty
    } catch (err) {
      throw new Error(`Error running function ${err.toString()}`);
    }

    if (result) return result;

    const duration = Date.now() - start;
    if (duration > waitTimeout) {
      throw new Error('waitForFunction timed out');
    }
    await pause(); // make polling
  }
}

class TestCafe {
  /**
   * {{> amOnPage }}
   */
  async amOnPage(url: string) {
    return t.navigateTo(url);
  }

  /**
   * {{> resizeWindow }}
   */
  async resizeWindow(width: number, height: number, maximize: boolean) {
    if (maximize) {
      return t.maximizeWindow();
    }

    return t.resizeWindow(width, height);
  }

  /**
   * {{> click }}
   *
   */
  async click(selector: Selector, options?: ClickActionOptions) {
    return t.click(selector, options);
  }

  /**
   * {{> refreshPage }}
   */
  async refreshPage() {
    // eslint-disable-next-line no-restricted-globals
    return t.eval(() => location.reload());
  }

  /**
   * {{> waitForVisible }}
   *
   */
  async waitForVisible(selector: Selector, timeout = 1000) {
    await t.expect(selector.exists).ok({ timeout: timeout });
  }

  /**
   * {{> fillField }}
   */
  async fillField(selector: Selector, value: string) {
    return t.typeText(selector, value, { replace: true });
  }

  /**
   * {{> clearField }}
   */
  async clearField(selector: Selector) {
    return t.selectText(selector).pressKey('delete');
  }

  /**
   * {{> appendField }}
   *
   */
  async appendField(selector: Selector, value: string) {
    return t.typeText(selector, value, { replace: false });
  }

  /**
   * {{> attachFile }}
   *
   */
  async attachFile(selector: Selector, pathToFile: string) {
    return t.setFilesToUpload(selector, [pathToFile]);
  }

  /**
   * {{> pressKey }}
   *
   * {{ keys }}
   */
  async pressKey(key: string) {
    assert(key, 'Expected a sequence of keys or key combinations');

    return t.pressKey(key.toLowerCase());
  }

  /**
   * {{> moveCursorTo }}
   *
   */
  async moveCursorTo(selector: Selector, offsetX = 0, offsetY = 0) {
    return t.hover(selector, { offsetX, offsetY });
  }

  /**
   * {{> doubleClick }}
   *
   */
  async doubleClick(selector: Selector) {
    return t.doubleClick(selector);
  }

  /**
   * {{> rightClick }}
   *
   */
  async rightClick(selector: Selector) {
    return t.rightClick(selector);
  }

  /**
   * {{> seeInCurrentUrl }}
   */
  async seeInCurrentUrl(url: string): Promise<boolean> {
    return new Promise<boolean>((resolve) =>
      resolve(getPageUrl().toString().includes(url))
    );
  }

  /**
   * {{> dontSeeInCurrentUrl }}
   */
  async dontSeeInCurrentUrl(url: string): Promise<boolean> {
    return !(await this.seeInCurrentUrl(url));
  }

  /**
   * {{> seeCurrentUrlEquals }}
   */
  async seeCurrentUrlEquals(url: string): Promise<boolean> {
    return (await getPageUrl()).toString() === url;
  }

  /**
   * {{> dontSeeCurrentUrlEquals }}
   */
  async dontSeeCurrentUrlEquals(url: string): Promise<boolean> {
    return !(await this.seeCurrentUrlEquals(url));
  }

  /**
   * {{> see }}
   *
   */
  async see(text: string, selector: Selector) {
    return t.expect(selector.withText(text).filterVisible().count).gt(0);
  }

  /**
   * {{> dontSee }}
   *
   */
  async dontSee(text: string, selector: Selector) {
    return !this.see(text, selector);
  }

  /**
   * {{> seeElement }}
   */
  async seeElement(selector: Selector) {
    const exists = (await selector).filterVisible().exists;

    return t.expect(exists).ok(`No element "${selector}" found`);
  }

  /**
   * {{> dontSeeElement }}
   */
  async dontSeeElement(selector: Selector) {
    const exists = (await selector).filterVisible().exists;

    return t.expect(exists).notOk(`Element "${selector}" is still visible`);
  }

  /**
   * {{> seeElementInDOM }}
   */
  async seeElementInDOM(selector: Selector) {
    const exists = (await selector).exists;

    return t.expect(exists).ok(`No element "${selector}" found in DOM`);
  }

  /**
   * {{> dontSeeElementInDOM }}
   */
  async dontSeeElementInDOM(selector: Selector) {
    const exists = (await selector).exists;

    return t.expect(exists).notOk(`Element "${selector}" is still in DOM`);
  }

  /**
   * {{> seeNumberOfVisibleElements }}
   *
   */
  async seeNumberOfVisibleElements(selector: Selector, num: number) {
    const count = (await selector).filterVisible().count;

    return t.expect(count).eql(num);
  }

  /**
   * {{> grabNumberOfVisibleElements }}
   */
  async grabNumberOfVisibleElements(selector: Selector) {
    return await selector.filterVisible().count;
  }

  /**
   * {{> seeInField }}
   */
  async seeInField(selector: Selector, value: string) {
    return t.expect(await selector.value).eql(value);
  }

  /**
   * {{> dontSeeInField }}
   */
  async dontSeeInField(selector: Selector, value: string) {
    // const expectedValue = findElements.call(this, this.context, field).value;
    const els = await selector;

    const el = await els.nth(0);

    return t.expect(el.value).notEql(value);
  }

  /**
   * {{> seeInSource }}
   */
  async seeInSource(text: string): Promise<boolean> {
    const source = await getHtmlSource();
    return new Promise<boolean>(() => source.toString().includes(text));
  }

  /**
   * {{> dontSeeInSource }}
   */
  async dontSeeInSource(text: string): Promise<boolean> {
    return !(await this.seeInSource(text));
  }

  /**
   * {{> saveScreenshot }}
   */
  async saveScreenshot(fileName: string) {
    return t.takeScreenshot(fileName);
  }

  /**
   * {{> wait }}
   */
  async wait(sec: number) {
    return t.wait(sec * 1000);
  }

  /**
   * {{> executeScript }}
   *
   * If a function returns a Promise It will wait for it resolution.
   */
  async executeScript(fn: any, ...args: any) {
    const getParamNames = (fn: any): Array<string> => {
      if (fn.isSinonProxy) return [];

      return getFunctionArguments(fn);
    };

    const getFuncBody = (func: any) => {
      let fnStr = func.toString();
      const arrowIndex = fnStr.indexOf('=>');
      if (arrowIndex >= 0) {
        fnStr = fnStr.slice(arrowIndex + 2);
        // eslint-disable-next-line no-new-func
        // eslint-disable-next-line no-eval
        return eval(`() => ${fnStr}`);
      }
      // TODO: support general functions
    };

    if (!args || !args.length) {
      return ClientFunction(fn);
    }
    const paramNames = getParamNames(fn);
    const dependencies: { [id: string]: any } = {};

    for (let i = 0; i < paramNames.length; i++) {
      dependencies[paramNames[i]] = args[i];
    }

    return ClientFunction(getFuncBody(fn));
  }

  /**
   * {{> grabTextFrom }}
   */
  async grabTextFrom(selector: Selector) {
    return selector.nth(0).innerText;
  }

  /**
   * {{> grabAttributeFrom }}
   */
  async grabAttributeFrom(selector: Selector, attr: string) {
    return (await selector.nth(0)).getAttribute(attr);
  }

  /**
   * {{> grabValueFrom }}
   */
  async grabValueFrom(selector: Selector) {
    return (await selector).value;
  }

  /**
   * {{> grabSource }}
   */
  async grabSource() {
    return ClientFunction(() => document.documentElement.innerHTML)();
  }

  /**
   * Get JS log from browser.
   *
   * ```js
   * let logs = await I.grabBrowserLogs();
   * console.log(JSON.stringify(logs))
   * ```
   */
  async grabBrowserLogs() {
    return t.getBrowserConsoleMessages();
  }

  /**
   * {{> grabCurrentUrl }}
   */
  async grabCurrentUrl() {
    return ClientFunction(() => document.location.href)();
  }

  /**
   * {{> grabPageScrollPosition }}
   */
  async grabPageScrollPosition() {
    return ClientFunction(() => ({
      x: window.pageXOffset,
      y: window.pageYOffset,
    }))();
  }

  /**
   * {{> scrollPageToTop }}
   */
  scrollPageToTop() {
    return ClientFunction(() => window.scrollTo(0, 0))();
  }

  /**
   * {{> scrollPageToBottom }}
   */
  scrollPageToBottom() {
    return ClientFunction(() => {
      const body = document.body;
      const html = document.documentElement;
      window.scrollTo(
        0,
        Math.max(
          body.scrollHeight,
          body.offsetHeight,
          html.clientHeight,
          html.scrollHeight,
          html.offsetHeight
        )
      );
    })();
  }

  /**
   * {{> scrollTo }}
   */
  async scrollTo(selector: Selector, offsetX = 0, offsetY = 0) {
    const scrollBy = ClientFunction((offset) => {
      if (window && window.scrollBy && offset) {
        window.scrollBy(offset.x, offset.y);
      }
    });

    if (selector) {
      const el = await selector.nth(0);
      const x = (await el.offsetLeft) + offsetX;
      const y = (await el.offsetTop) + offsetY;

      return scrollBy({ x, y });
    }

    const x = offsetX;
    const y = offsetY;
    return scrollBy({ x, y });
  }

  /**
   * {{> switchTo }}
   */
  async switchTo(selector: Selector) {
    if (!selector) {
      return t.switchToMainWindow();
    }

    return t.switchToIframe(selector);
  }

  /**
   * {{> setCookie }}
   */
  async setCookie(cookie: Record<string, any>) {
    let strCookie = `${cookie.name}=${cookie.value};`;

    if (cookie.path) strCookie += `path=${cookie.path};`;

    if (cookie.expires) strCookie += `expires=${cookie.expires}`;

    const setCookieFn = ClientFunction(
      () => {
        document.cookie = strCookie;
      },
      { dependencies: { strCookie } }
    );

    return setCookieFn();
  }

  /**
   * {{> seeCookie }}
   *
   */
  async seeCookie(name: string) {
    const cookie = await this.getCookie(name);
    return !!cookie;
  }

  /**
   * {{> dontSeeCookie }}
   */
  async dontSeeCookie(name: string) {
    const cookie = await this.getCookie(name);
    return !cookie;
  }

  /**
   * {{> getCookie }}
   *
   * Returns cookie in JSON format. If name not passed returns all cookies for this domain.
   */
  async getCookie(name?: string): Promise<Array<Record<string, string>>> {
    const getCookiesFn = ClientFunction(() => {
      return document.cookie;
    });

    const mappedCookies = (await getCookiesFn())
      .split('; ')
      .map((c) => c.split('='))
      .map((cookie) => ({
        name: cookie[0],
        value: cookie[1],
      }));

    if (name) {
      return mappedCookies.filter((cookie) => cookie.name === name);
    }

    return mappedCookies;
  }

  /**
   * {{> clearCookie }}
   */
  async clearCookie(cookieName: string) {
    const clearCookies = ClientFunction(
      () => {
        const cookies = document.cookie.split(';');

        for (let i = 0; i < cookies.length; i++) {
          const cookie = cookies[i];
          const eqPos = cookie.indexOf('=');
          const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
          if (cookieName === undefined || name === cookieName) {
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT`;
          }
        }
      },
      { dependencies: { cookieName } }
    );

    return clearCookies();
  }

  /**
   * {{> waitInUrl }}
   */
  async waitInUrl(urlPart: string, timeoutSec = 1000) {
    const clientFn = ClientFunction(() => {
      const currUrl = decodeURIComponent(
        decodeURIComponent(decodeURIComponent(window.location.href))
      );
      return currUrl.indexOf(urlPart) > -1;
    });

    return waitForFunction(clientFn, timeoutSec).catch(async () => {
      const currUrl = await this.grabCurrentUrl();
      throw new Error(
        `expected url to include ${urlPart}, but found ${currUrl}`
      );
    });
  }

  /**
   * {{> waitUrlEquals }}
   */
  async waitUrlEquals(url: string, timeoutSec = 1000) {
    const clientFn = ClientFunction(() => {
      const currUrl = decodeURIComponent(
        decodeURIComponent(decodeURIComponent(window.location.href))
      );
      return currUrl === url;
    });

    return waitForFunction(clientFn, timeoutSec).catch(async () => {
      const currUrl = await this.grabCurrentUrl();
      throw new Error(`expected url to include ${url}, but found ${currUrl}`);
    });
  }

  /**
   * {{> waitForFunction }}
   */
  async waitForFunction(fn: any, argsOrSec: any, timeoutSec = 1000) {
    let args: any[];
    if (argsOrSec) {
      if (Array.isArray(argsOrSec)) {
        args = argsOrSec;
      } else if (typeof argsOrSec === 'number') {
        timeoutSec = argsOrSec;
      }
    }
    const clientFn = ClientFunction(() => fn(args));

    return waitForFunction(clientFn, timeoutSec);
  }

  /**
   * {{> waitNumberOfVisibleElements }}
   */
  async waitNumberOfVisibleElements(
    selector: Selector,
    count: number,
    timeoutSec: number
  ) {
    return t
      .expect(await selector.filterVisible().count)
      .eql(
        count,
        `The number of elements (${selector}) is not ${count} after ${timeoutSec} sec`,
        { timeout: timeoutSec }
      );
  }

  /**
   * {{> waitForElement }}
   */
  async waitForElement(selector: Selector, timeoutSec: number) {
    return t.expect(selector.exists).ok({ timeout: timeoutSec });
  }

  /**
   * {{> waitToHide }}
   */
  async waitToHide(selector: Selector, timeoutSec: number) {
    return t
      .expect(selector.filterHidden().exists)
      .notOk({ timeout: timeoutSec });
  }

  /**
   * {{> waitForInvisible }}
   */
  async waitForInvisible(selector: Selector, timeoutSec: number) {
    return t
      .expect(selector.filterVisible().exists)
      .ok({ timeout: timeoutSec });
  }

  /**
   * {{> waitForText }}
   *
   */
  async waitForText(text: string, timeoutSec: number, selector: Selector) {
    return t
      .expect(selector.withText(text).filterVisible().exists)
      .ok(`No element with text "${text}" found in ${selector || 'body'}`, {
        timeout: timeoutSec,
      });
  }
}

export const helper = new TestCafe();

export class RequestConsoleLogger extends RequestHook {
  async onRequest(event: object) {
    this.logSpecific(event);
  }

  async onResponse(event: object) {
    this.logSpecific(event);
  }

  async logSpecific(event: object) {
    const logObject = (event as Record<string, any>)._requestInfo;

    if (logObject) console.dir(JSON.stringify(logObject), { depth: null });
  }
}
