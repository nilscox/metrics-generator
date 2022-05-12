import fetch from "cross-fetch";
import FormData, { Stream } from "form-data";

const randInt = (max: number) => {
  return Math.floor(Math.random() * max);
};

const randBool = () => {
  return randInt(2) === 1;
};

const randItem = <T>(arr: T[]): T => {
  return arr[randInt(arr.length)];
};

type FetchOpts = {
  method?: string;
  query?: Record<string, string | number>;
  headers?: Record<string, string>;
  body?: BodyInit;
};

const f = async (route: string, opts?: FetchOpts) => {
  let url = BASE_URL;

  url += route;

  if (opts?.query) {
    url += "?";
    url += new URLSearchParams(opts.query as Record<string, string>).toString();
  }

  try {
    return await fetch(url, {
      method: opts?.method,
      headers: opts?.headers,
      body: opts?.body,
    });
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

const memory = async () => {
  const mb = randInt(32);
  const keep = randInt(60 * 10);

  console.log(
    `allocating ${mb}MB of memory, releasing in ${Math.round(keep / 60)}min`
  );

  f("/allocate", {
    query: { mb, keep },
  });
};

const cpu = async () => {
  if (randBool()) {
    const n = randInt(100) * 1000 * 1000;

    console.log(`generating ${n} square roots of 2`);

    f("/sqrt2", {
      query: { n },
    });
  } else {
    const n = 30 + randInt(15);

    console.log(`computing fibo(${n})`);

    f("/fibo", {
      query: { n },
    });
  }
};

const status = async () => {
  const status = Number(
    `${randItem([2, 3, 4, 5])}${String(randInt(20)).padStart(2, "0")}`
  );

  console.log(`make query with status code ${status}`);

  f("/status", {
    query: { status },
  });
};

const wait = async () => {
  const time = randInt(1300);

  console.log(`making query taking ${time}ms`);

  f("/wait", {
    query: { time },
  });
};

const send = async () => {
  const mb = randInt(128);
  const buf = Buffer.allocUnsafe(mb * 1024 * 1024);
  const formData = new FormData();

  formData.append("file", buf, {
    contentType: "text/plain",
    filename: "file",
  });

  console.log(`sending ${mb}MB of data`);

  await f("/send", {
    method: "POST",
    body: formData as any,
  });
};

const generate = async () => {
  const mb = randInt(128);

  console.log(`requesting ${mb}MB of data`);

  await f("/generate", {
    query: { mb },
  });
};

const { BASE_URL = "http://localhost:8080" } = process.env;

const main = async () => {
  const functions = [
    [1, memory],
    [15, cpu],
    [5, status],
    [5, wait],
    [10, send],
    [10, generate],
  ] as const;

  const allFunctions = functions.flatMap(([count, f]) => Array(count).fill(f));

  while (true) {
    await randItem(allFunctions)();
    await new Promise((r) => setTimeout(r, 1000));
  }
};

main().catch(console.error);
