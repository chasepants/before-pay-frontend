const mockSerpResults = [
    {
      "position": 1,
      "title": "Apple MacBook Air M3 CPU",
      "product_link": "https://www.google.com/shopping/product/3466242253988572532?gl=us",
      "product_id": "3466242253988572532",
      "serpapi_product_api": "https://serpapi.com/search.json?engine=google_product&gl=us&google_domain=google.com&hl=en&product_id=3466242253988572532",
      "immersive_product_page_token": "eyJlaSI6Ind4M3JaX2E5Tkp5U3ZyMFBqTVdFd0FrIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiMzQ2NjI0MjI1Mzk4ODU3MjUzMiIsImhlYWRsaW5lT2ZmZXJEb2NpZCI6Ijc4Nzk1MzY0NzM0Mjc1ODAwNzkiLCJpbWFnZURvY2lkIjoiNTM3MjM4Nzg0NTM1NTkwMzUzOCIsInJkcyI6IlBDXzMzNzY0NzEzOTAxMzIxOTI0NTZ8UFJPRF9QQ18zMzc2NDcxMzkwMTMyMTkyNDU2IiwicXVlcnkiOiJNYWNib29rK00zIiwiZ3BjaWQiOiIzMzc2NDcxMzkwMTMyMTkyNDU2IiwibWlkIjoiNTc2NDYyNzkwOTgyODI1NDkyIiwicHZ0IjoiaGciLCJ1dWxlIjpudWxsfQ==",
      "serpapi_immersive_product_api": "https://serpapi.com/search.json?engine=google_immersive_product&page_token=eyJlaSI6Ind4M3JaX2E5Tkp5U3ZyMFBqTVdFd0FrIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiMzQ2NjI0MjI1Mzk4ODU3MjUzMiIsImhlYWRsaW5lT2ZmZXJEb2NpZCI6Ijc4Nzk1MzY0NzM0Mjc1ODAwNzkiLCJpbWFnZURvY2lkIjoiNTM3MjM4Nzg0NTM1NTkwMzUzOCIsInJkcyI6IlBDXzMzNzY0NzEzOTAxMzIxOTI0NTZ8UFJPRF9QQ18zMzc2NDcxMzkwMTMyMTkyNDU2IiwicXVlcnkiOiJNYWNib29rK00zIiwiZ3BjaWQiOiIzMzc2NDcxMzkwMTMyMTkyNDU2IiwibWlkIjoiNTc2NDYyNzkwOTgyODI1NDkyIiwicHZ0IjoiaGciLCJ1dWxlIjpudWxsfQ%3D%3D",
      "source": "Best Buy",
      "source_icon": "https://serpapi.com/searches/67eb1dbdee34034ffc318c2f/images/76efabd3c57ab8e6af3c3b0ca17d9462c85e17ad63f0ee78f2debda3dc8e56ee.png",
      "price": "$849.00",
      "extracted_price": 849,
      "old_price": "$999",
      "extracted_old_price": 999,
      "rating": 4.8,
      "reviews": 7200,
      "snippet": "Performs well (678 user reviews)",
      "thumbnail": "https://serpapi.com/searches/67eb1dbdee34034ffc318c2f/images/76efabd3c57ab8e6af3c3b0ca17d94620124e30d0c13b1e8dc19df8809356cac.webp",
      "thumbnails":
      [
          "https://encrypted-tbn2.gstatic.com/shopping?q=tbn:ANd9GcSCuSSbJt4gryz3LpMsEMCFq2lBu-mo0QZrK_f4s2cLZws6Ys304hEYzGj9Q_l3rJEvMrxu3IYXFQhj-T_h6Cd7o-Nn4cOs9nsJteO-FN4"
      ]
      ,
      "tag": "SAVE 15%",
      "extensions":
      [
          "SAVE 15%"
      ]
      ,
      "delivery": "Free delivery"
  }
  ,
  {
      "position": 2,
      "title": "Apple 14-Inch MacBook Pro Apple M3 Chip",
      "product_link": "https://www.google.com/shopping/product/12153035126592663857?gl=us",
      "product_id": "12153035126592663857",
      "serpapi_product_api": "https://serpapi.com/search.json?engine=google_product&gl=us&google_domain=google.com&hl=en&product_id=12153035126592663857",
      "immersive_product_page_token": "eyJlaSI6Ind4M3JaX2E5Tkp5U3ZyMFBqTVdFd0FrIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiMTIxNTMwMzUxMjY1OTI2NjM4NTciLCJoZWFkbGluZU9mZmVyRG9jaWQiOiIxMDgwNTc5NTY2NTE5Nzk4MDY0MiIsImltYWdlRG9jaWQiOiIxMzgxNTY0MjU2Nzg0NTMyMDk2IiwicmRzIjoiUENfMTY5NzQ1OTY3Nzg4MTcwODE0NDh8UFJPRF9QQ18xNjk3NDU5Njc3ODgxNzA4MTQ0OCIsInF1ZXJ5IjoiTWFjYm9vaytNMyIsImdwY2lkIjoiMTY5NzQ1OTY3Nzg4MTcwODE0NDgiLCJtaWQiOiI1NzY0NjI3MDA0NzQ5MTc1NzYiLCJwdnQiOiJoZyIsInV1bGUiOm51bGx9",
      "serpapi_immersive_product_api": "https://serpapi.com/search.json?engine=google_immersive_product&page_token=eyJlaSI6Ind4M3JaX2E5Tkp5U3ZyMFBqTVdFd0FrIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiMTIxNTMwMzUxMjY1OTI2NjM4NTciLCJoZWFkbGluZU9mZmVyRG9jaWQiOiIxMDgwNTc5NTY2NTE5Nzk4MDY0MiIsImltYWdlRG9jaWQiOiIxMzgxNTY0MjU2Nzg0NTMyMDk2IiwicmRzIjoiUENfMTY5NzQ1OTY3Nzg4MTcwODE0NDh8UFJPRF9QQ18xNjk3NDU5Njc3ODgxNzA4MTQ0OCIsInF1ZXJ5IjoiTWFjYm9vaytNMyIsImdwY2lkIjoiMTY5NzQ1OTY3Nzg4MTcwODE0NDgiLCJtaWQiOiI1NzY0NjI3MDA0NzQ5MTc1NzYiLCJwdnQiOiJoZyIsInV1bGUiOm51bGx9",
      "source": "B&H Photo-Video-Audio",
      "source_icon": "https://serpapi.com/searches/67eb1dbdee34034ffc318c2f/images/76efabd3c57ab8e6af3c3b0ca17d94627a3bfa06e6e049827ea3ad14575cc2c1.png",
      "price": "$999.00",
      "extracted_price": 999,
      "old_price": "$1,699",
      "extracted_old_price": 1699,
      "rating": 4.8,
      "reviews": 2200,
      "snippet": "Performs well (219 user reviews)",
      "thumbnail": "https://serpapi.com/searches/67eb1dbdee34034ffc318c2f/images/76efabd3c57ab8e6af3c3b0ca17d9462c90224adc7ac15919800bb150a02b236.webp",
      "thumbnails":
      [
          "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcSOXjfmFdS3LwLLnet_y9bO-_jBV5vZP7xtaT5Yg786b4JQEkB1pgnp_MmlTtDEb8UmK7IINogV-DLEfrt9CVcfprPiLcRQyocXAPZX_64"
      ]
      ,
      "tag": "SAVE 41%",
      "extensions":
      [
          "SAVE 41%"
      ]
      ,
      "delivery": "Get it by Thu (Free)"
  }
  ,
  {
      "position": 3,
      "title": "Apple MacBook Air M3 15",
      "product_link": "https://www.google.com/shopping/product/1545155620894528136?gl=us",
      "product_id": "1545155620894528136",
      "serpapi_product_api": "https://serpapi.com/search.json?engine=google_product&gl=us&google_domain=google.com&hl=en&product_id=1545155620894528136",
      "immersive_product_page_token": "eyJlaSI6Ind4M3JaX2E5Tkp5U3ZyMFBqTVdFd0FrIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiMTU0NTE1NTYyMDg5NDUyODEzNiIsImhlYWRsaW5lT2ZmZXJEb2NpZCI6Ijk0NDUxNjcxNjQ4NDEyNjIwNDIiLCJpbWFnZURvY2lkIjoiMTMzODU1Mjk2OTc0OTI0MDMwMzgiLCJyZHMiOiJQQ18xNjM2NjEwODk5ODY0NDIyMTAzM3xQUk9EX1BDXzE2MzY2MTA4OTk4NjQ0MjIxMDMzIiwicXVlcnkiOiJNYWNib29rK00zIiwiZ3BjaWQiOiIxNjM2NjEwODk5ODY0NDIyMTAzMyIsIm1pZCI6IjU3NjQ2Mjc4MTQ3OTk1MzMwMCIsInB2dCI6ImhnIiwidXVsZSI6bnVsbH0=",
      "serpapi_immersive_product_api": "https://serpapi.com/search.json?engine=google_immersive_product&page_token=eyJlaSI6Ind4M3JaX2E5Tkp5U3ZyMFBqTVdFd0FrIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiMTU0NTE1NTYyMDg5NDUyODEzNiIsImhlYWRsaW5lT2ZmZXJEb2NpZCI6Ijk0NDUxNjcxNjQ4NDEyNjIwNDIiLCJpbWFnZURvY2lkIjoiMTMzODU1Mjk2OTc0OTI0MDMwMzgiLCJyZHMiOiJQQ18xNjM2NjEwODk5ODY0NDIyMTAzM3xQUk9EX1BDXzE2MzY2MTA4OTk4NjQ0MjIxMDMzIiwicXVlcnkiOiJNYWNib29rK00zIiwiZ3BjaWQiOiIxNjM2NjEwODk5ODY0NDIyMTAzMyIsIm1pZCI6IjU3NjQ2Mjc4MTQ3OTk1MzMwMCIsInB2dCI6ImhnIiwidXVsZSI6bnVsbH0%3D",
      "source": "BrandsMart USA",
      "source_icon": "https://serpapi.com/searches/67eb1dbdee34034ffc318c2f/images/76efabd3c57ab8e6af3c3b0ca17d94622ac26ec5052a6f39b1a533ff5d9395d3.png",
      "price": "$949.00",
      "extracted_price": 949,
      "old_price": "$1,299",
      "extracted_old_price": 1299,
      "rating": 4.8,
      "reviews": 3400,
      "snippet": "Performs well (293 user reviews)",
      "thumbnail": "https://serpapi.com/searches/67eb1dbdee34034ffc318c2f/images/76efabd3c57ab8e6af3c3b0ca17d9462b50d3f47d661089f2d55a49c29ecd8d8.webp",
      "thumbnails":
      [
          "https://encrypted-tbn2.gstatic.com/shopping?q=tbn:ANd9GcQVrMb_ofAJN_eGInRfdCa_SGM8DWj2mLLevh13rE_tWQbZd_uwlA9J2U6YudXdfjF1Rbn2cCb7WPpGjGVYHZzqYezw_ouX"
      ]
      ,
      "tag": "SAVE 26%",
      "extensions":
      [
          "SAVE 26%"
      ]
  }
];

module.exports = mockSerpResults;