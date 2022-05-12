import fetch from "cross-fetch";

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
  query?: Record<string, string | number>;
};

const f = async (route: string, opts?: FetchOpts) => {
  let url = BASE_URL;

  url += route;

  if (opts?.query) {
    url += "?";
    url += new URLSearchParams(opts.query as Record<string, string>).toString();
  }

  try {
    await fetch(url);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

const memory = async () => {
  const mb = randInt(128);

  console.log(`allocating ${mb}MB of memory`);

  f("/allocate", {
    query: { mb, keep: 5 * 60 },
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
  const time = randInt(2000);

  console.log(`making query taking ${time}ms`);

  f("/wait", {
    query: { time },
  });
};

const receive = async () => {};

const generate = async () => {};

const { BASE_URL = "http://localhost:8080" } = process.env;

const main = async () => {
  const functions = [memory, cpu, status, wait, receive, generate];

  while (true) {
    await randItem(functions)();
    await new Promise((r) => setTimeout(r, 10 * 1000));
  }
};

main().catch(console.error);
