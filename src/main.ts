import axios from "axios";
import readline from "readline/promises";
import { stdin as input, stdout as output } from "node:process";
import chalk from "chalk";

interface CoinData {
  last_price: number;
  lowest_ask: number;
  highest_bid: number;
  base_volume: number;
  high_24hr: number;
  low_24hr: number;
  change_perc_24hr: number;
}

type MarketData = Record<string, CoinData>;

let favoriteCoins: string[] = [];

// Fetch market data from the ByteDex API
async function fetchMarketData(): Promise<MarketData> {
  try {
    const { data } = await axios.get<MarketData>(
      "https://apiv2.bytedex.io/market/markets"
    );
    return data;
  } catch (error) {
    console.error(chalk.red("Error fetching market data:"), error);
    return {};
  }
}

// Display USDT coins sorted by daily change percentage
function displayUSDTCoins(data: MarketData, highest = false, length = 5): void {
  console.clear();
  console.log(chalk.blue.bold("\nİlk 5 Coin"));

  Object.entries(data)
    .filter(([name]) => name.endsWith("USDT"))
    .sort(
      ([, a], [, b]) =>
        (highest && b.change_perc_24hr - a.change_perc_24hr) ||
        a.change_perc_24hr - b.change_perc_24hr
    )
    .slice(0, length)
    .forEach(([name, coin]) => {
      console.log(
        `${chalk.green(name.replace("_USDT", ""))} - ${chalk.yellow(
          "İ.F:"
        )} ${chalk.cyan(coin.low_24hr.toFixed(2))} - ${chalk.yellow(
          "S.F:"
        )} ${chalk.cyan(coin.high_24hr.toFixed(2))} - ${chalk.magenta(
          "GÜNLÜK DEĞİŞİM:"
        )} ${chalk.cyan(coin.change_perc_24hr.toFixed(2))}%`
      );
    });
}

// Display coins added to the favorites list
function displayFavoriteCoins(data: MarketData): void {
  console.clear();
  console.log(chalk.blue.bold("\nFavori Coinleriniz:"));
  if (favoriteCoins.length === 0) {
    console.log(chalk.red("Favori coininiz yok."));
  } else {
    favoriteCoins.forEach((coinName) => {
      const coin = data[`${coinName}_USDT`];
      if (coin) {
        console.log(
          `${chalk.green(coinName)} - ${chalk.yellow("Fiyat:")} ${chalk.cyan(
            coin.last_price.toFixed(2)
          )} ${chalk.magenta("GÜNLÜK DEĞİŞİM:")} ${chalk.cyan(
            coin.change_perc_24hr.toFixed(2)
          )}%`
        );
      } else {
        console.log(`${chalk.red(coinName)} - Veri bulunamadı.`);
      }
    });
  }
}

// Handle the main menu interactions
async function mainMenu(
  rl: readline.Interface,
  data: MarketData
): Promise<void> {
  console.clear();
  console.log(chalk.blue.bold("\nFAVORİ COİNLERİNİZ"));
  displayFavoriteCoins(data);

  console.log(chalk.green("\n1- Günlük En Çok Artan Coinleri Gör"));
  console.log(chalk.green("2- Günlük En Çok Azalan Coinleri Gör"));
  console.log(chalk.green("3- Coin Fiyatına Bak"));
  console.log(chalk.green("4- Favori Coin Ekle"));
  console.log(chalk.green("5- Favori Coin Sil"));
  console.log(chalk.green("6- Tüm Coinleri Listele"));
  console.log(chalk.red("9- Çıkış\n"));

  const choice = await rl.question(chalk.yellow("Seçiminizi yapın: "));

  switch (choice) {
    case "1":
      displayUSDTCoins(data, true);
      console.log(
        chalk.blue("\nAna menüye dönmek için herhangi bir tuşa basınız.")
      );
      await rl.question("");
      break;

    case "2":
      console.clear();
      console.log(chalk.blue.bold("\nGünlük En Çok Azalan Coinler:"));
      displayUSDTCoins(data, false);

      console.log(
        chalk.blue("\nAna menüye dönmek için herhangi bir tuşa basınız.")
      );
      await rl.question("");
      break;

    case "3":
      const coinName = await rl.question(chalk.yellow("Coin adını girin: "));
      const coin = data[`${coinName}_USDT`];
      if (coin) {
        console.log(
          `\n${chalk.green(coinName)} \n` +
            `${chalk.yellow("Günlük Son Fiyat:")} ${chalk.cyan(
              coin.last_price.toFixed(2)
            )} \n` +
            `${chalk.yellow("Günlük İlk Fiyat:")} ${chalk.cyan(
              coin.low_24hr.toFixed(2)
            )} \n` +
            `${chalk.yellow("Günlük En Yüksek Fiyat:")} ${chalk.cyan(
              coin.high_24hr.toFixed(2)
            )} \n` +
            `${chalk.yellow("Günlük En Düşük Fiyat:")} ${chalk.cyan(
              coin.low_24hr.toFixed(2)
            )} \n` +
            `${chalk.magenta("Günlük Değişim Oranı:")} ${chalk.cyan(
              coin.change_perc_24hr.toFixed(2)
            )}%`
        );
      } else {
        console.log(chalk.red("Coin bulunamadı."));
      }
      console.log(
        chalk.blue("\nAna menüye dönmek için herhangi bir tuşa basınız.")
      );
      await rl.question("");
      break;
    case "4":
      const addCoin = await rl.question(
        chalk.yellow("Favorilere eklemek istediğiniz coin adını girin: ")
      );

      if (!favoriteCoins.includes(`${addCoin}`)) {
        const coin = data[`${addCoin}_USDT`];

        if (!coin) {
          console.log(
            chalk.red(
              `${addCoin} adlı değer markette bulunmuyor. Coinleri listelemek için ana menüye dönüp ${chalk.green(
                "6 numaralı "
              )} seçimi yapabilirsiniz.`
            )
          );
        } else {
          favoriteCoins.push(`${addCoin}`);
          console.log(chalk.green(`${addCoin} favorilere eklendi.`));
        }
      } else {
        console.log(chalk.red(`${addCoin} zaten favorilerinizde.`));
      }
      console.log(
        chalk.blue("\nAna menüye dönmek için herhangi bir tuşa basınız.")
      );
      await rl.question("");
      break;

    case "5":
      const removeCoin = await rl.question(
        chalk.yellow("Favorilerden silmek istediğiniz coin adını girin: ")
      );
      favoriteCoins = favoriteCoins.filter((coin) => coin !== removeCoin);
      console.log(chalk.green(`${removeCoin} favorilerden silindi.`));
      console.log(
        chalk.blue("\nAna menüye dönmek için herhangi bir tuşa basınız.")
      );
      await rl.question("");
      break;

    case "6":
      displayUSDTCoins(data, true, 99);
      console.log(
        chalk.blue("\nAna menüye dönmek için herhangi bir tuşa basınız.")
      );
      await rl.question("");
      break;

    case "9":
      console.log(chalk.red("Çıkış yapılıyor..."));
      process.exit(0);

    default:
      console.log(chalk.red("Geçersiz seçim. Tekrar deneyin."));
  }
}

// Main function to start the program
async function main() {
  const rl = readline.createInterface({ input, output });
  while (true) {
    const marketData = await fetchMarketData();
    await mainMenu(rl, marketData);
  }
}

main().catch((error) => {
  console.error(chalk.red("Bir hata oluştu:"), error);
});
