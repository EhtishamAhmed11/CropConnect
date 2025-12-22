import mongoose from "mongoose";
import connectDb from "../connection/db.connection.js";
import Province from "../models/province.model.js";
import CropType from "../models/cropType.model.js";
import ProductionData from "../models/productionData.model.js";
import dotenv from "dotenv";

dotenv.config();

const WHEAT_DATA = [
    { year: "1947-48", PB: 2595, SD: 371, KP: 280, BL: 55, PK: 3301 },
    { year: "1948-49", PB: 3232, SD: 401, KP: 268, BL: 73, PK: 3974 },
    { year: "1949-50", PB: 3131, SD: 347, KP: 295, BL: 89, PK: 3862 },
    { year: "1950-51", PB: 3299, SD: 296, KP: 261, BL: 74, PK: 3930 },
    { year: "1951-52", PB: 2436, SD: 273, KP: 189, BL: 64, PK: 2962 },
    { year: "1952-53", PB: 1777, SD: 376, KP: 160, BL: 54, PK: 2367 },
    { year: "1953-54", PB: 2910, SD: 387, KP: 213, BL: 77, PK: 3587 },
    { year: "1954-55", PB: 2492, SD: 368, KP: 204, BL: 72, PK: 3136 },
    { year: "1955-56", PB: 2612, SD: 372, KP: 255, BL: 78, PK: 3317 },
    { year: "1956-57", PB: 2846, SD: 395, KP: 270, BL: 70, PK: 3581 },
    { year: "1957-58", PB: 2750, SD: 398, KP: 279, BL: 81, PK: 3508 },
    { year: "1958-59", PB: 3042, SD: 432, PK: 301, BL: 70, PK: 3845 }, // KP was missing in raw for 58-59 PK sum, but KP=301 in text? Wait KP=301 is provided.
    { year: "1959-60", PB: 2977, SD: 441, KP: 353, BL: 76, PK: 3847 },
    { year: "1960-61", PB: 2899, SD: 477, KP: 301, BL: 77, PK: 3754 },
    { year: "1961-62", PB: 3109, SD: 495, KP: 304, BL: 55, PK: 3963 },
    { year: "1962-63", PB: 3309, SD: 425, KP: 301, BL: 69, PK: 4104 },
    { year: "1963-64", PB: 3209, SD: 464, KP: 343, BL: 80, PK: 4096 },
    { year: "1964-65", PB: 3514, SD: 544, KP: 361, BL: 99, PK: 4518 },
    { year: "1965-66", PB: 2931, SD: 533, KP: 304, BL: 86, PK: 3854 },
    { year: "1966-67", PB: 3346, SD: 551, KP: 283, BL: 86, PK: 4266 },
    { year: "1967-68", PB: 4966, SD: 832, KP: 389, BL: 130, PK: 6317 },
    { year: "1968-69", PB: 5185, SD: 845, KP: 381, BL: 102, PK: 6513 },
    { year: "1969-70", PB: 5552, SD: 1090, KP: 375, BL: 162, PK: 7179 },
    { year: "1970-71", PB: 4948.2, SD: 1120.7, KP: 331.2, BL: 76.2, PK: 6476.3 },
    { year: "1971-72", PB: 5291.1, SD: 1081.1, KP: 439.6, BL: 78.6, PK: 6890.4 },
    { year: "1972-73", PB: 5693.5, SD: 1095.8, KP: 584.4, BL: 68.6, PK: 7442.3 },
    { year: "1973-74", PB: 5664.8, SD: 1246, KP: 606.9, BL: 111.2, PK: 7628.9 },
    { year: "1974-75", PB: 5785.6, SD: 1143.6, KP: 613.2, BL: 131.1, PK: 7673.5 },
    { year: "1975-76", PB: 6571.6, SD: 1320.9, KP: 660.4, BL: 137.8, PK: 8690.7 },
    { year: "1976-77", PB: 6807.7, SD: 1478.6, KP: 711.4, BL: 146, PK: 9143.7 },
    { year: "1977-78", PB: 6090.2, SD: 1427, KP: 688.6, BL: 161.4, PK: 8367.2 },
    { year: "1978-79", PB: 7323.6, SD: 1680.1, KP: 737.5, BL: 208.8, PK: 9950 },
    { year: "1979-80", PB: 7913.5, SD: 1849.4, KP: 862.5, BL: 231.1, PK: 10856.5 },
    { year: "1980-81", PB: 8350, SD: 1945.8, KP: 940.8, BL: 238, PK: 11474.6 },
    { year: "1981-82", PB: 7962.1, SD: 2061.7, KP: 962.2, BL: 318.2, PK: 11304.2 },
    { year: "1982-83", PB: 8935.1, SD: 2066.7, KP: 998.4, BL: 414.2, PK: 12414.4 },
    { year: "1983-84", PB: 7622.8, SD: 1945.8, KP: 859.8, BL: 453.5, PK: 10881.9 },
    { year: "1984-85", PB: 8315.1, SD: 2078.7, KP: 872.1, BL: 437.1, PK: 11703 },
    { year: "1985-86", PB: 10431.6, SD: 2172.2, KP: 906.5, BL: 412.7, PK: 13923 },
    { year: "1986-87", PB: 8334.3, SD: 2211.5, KP: 959.4, BL: 510.7, PK: 12015.9 },
    { year: "1987-88", PB: 9203.8, SD: 2180.4, KP: 899.2, BL: 391.7, PK: 12675.1 },
    { year: "1988-89", PB: 10517, SD: 2360.6, KP: 1003.7, BL: 537.9, PK: 14419.2 },
    { year: "1989-90", PB: 10518.2, SD: 2130.9, KP: 1102.1, BL: 564.3, PK: 14315.5 },
    { year: "1990-91", PB: 10513.8, SD: 2274.5, KP: 1148.4, BL: 628.3, PK: 14565 },
    { year: "1991-92", PB: 11492.3, SD: 2365.4, KP: 1163.4, BL: 663.1, PK: 15684.2 },
    { year: "1992-93", PB: 11742, SD: 2418, KP: 1183, BL: 813.5, PK: 16156.5 },
    { year: "1993-94", PB: 11218, SD: 2116.6, KP: 1134.3, BL: 744.1, PK: 15213 },
    { year: "1994-95", PB: 12713, SD: 2319.1, KP: 1180.2, BL: 790.1, PK: 17002.4 },
    { year: "1995-96", PB: 12430, SD: 2344.8, KP: 1202.5, BL: 930.1, PK: 16907.4 },
    { year: "1996-97", PB: 12371, SD: 2443.9, KP: 1064.4, BL: 771.2, PK: 16650.5 },
    { year: "1997-98", PB: 13807, SD: 2659.4, KP: 1356, BL: 871.6, PK: 18694 },
    { year: "1998-99", PB: 13212, SD: 2675.1, KP: 1221.8, BL: 748.7, PK: 17857.6 },
    { year: "1999-00", PB: 16480, SD: 3001.3, KP: 1067.8, BL: 529.5, PK: 21078.6 },
    { year: "2000-01", PB: 15419, SD: 2226.5, KP: 764, BL: 614.2, PK: 19023.7 },
    { year: "2001-02", PB: 14594.4, SD: 2101, KP: 890.5, BL: 640.6, PK: 18226.5 },
    { year: "2002-03", PB: 15355, SD: 2109.2, KP: 1064.4, BL: 654.7, PK: 19183.3 },
    { year: "2003-04", PB: 15639, SD: 2172.2, KP: 1025.2, BL: 663.4, PK: 19499.8 },
    { year: "2004-05", PB: 17375, SD: 2508.6, KP: 1091.1, BL: 637.6, PK: 21612.3 },
    { year: "2005-06", PB: 16776, SD: 2750.3, KP: 1100.6, BL: 649.9, PK: 21276.8 },
    { year: "2006-07", PB: 17853, SD: 3409.2, KP: 1160.4, BL: 872.1, PK: 23294.7 },
    { year: "2007-08", PB: 15607, SD: 3411.4, KP: 1071.8, BL: 868.6, PK: 20958.8 },
    { year: "2008-09", PB: 18420, SD: 3540.2, KP: 1204.5, BL: 868.2, PK: 24032.9 },
    { year: "2009-10", PB: 17919, SD: 3703.1, KP: 1152.5, BL: 536.2, PK: 23310.8 },
    { year: "2010-11", PB: 19041, SD: 4287.9, KP: 1155.8, BL: 729.1, PK: 25213.8 },
    { year: "2011-12", PB: 17738.9, SD: 3761.5, KP: 1130.3, BL: 842.7, PK: 23473.4 },
    { year: "2012-13", PB: 18587, SD: 3598.7, KP: 1257.6, BL: 768.1, PK: 24211.4 },
    { year: "2013-14", PB: 19738.9, SD: 4002.1, KP: 1363.1, BL: 875.3, PK: 25979.4 },
    { year: "2014-15", PB: 19281.9, SD: 3672.2, KP: 1259.9, BL: 872.1, PK: 25086.1 },
    { year: "2015-16", PB: 19526.7, SD: 3834.6, KP: 1400.5, BL: 871.3, PK: 25633.1 },
    { year: "2016-17", PB: 20466.3, SD: 3910.4, KP: 1365.1, BL: 931.8, PK: 26673.6 },
    { year: "2017-18", PB: 19178.5, SD: 3639.5, KP: 1322.7, BL: 935.4, PK: 25076.1 },
    { year: "2018-19", PB: 18377.2, SD: 3778.9, KP: 1336.7, BL: 865.3, PK: 24358.1 },
    { year: "2019-20", PB: 19401.9, SD: 3850, KP: 1130.4, BL: 867.2, PK: 25249.5 },
    { year: "2020-21", PB: 20900, SD: 4043.17, KP: 1361.58, BL: 1159.33, PK: 27464.08 },
    { year: "2021-22", PB: 20032, SD: 3759.75, KP: 1380.92, BL: 1220.98, PK: 26393.65 },
    { year: "2022-23", PB: 21225, SD: 3940.17, KP: 1494.14, BL: 1516.23, PK: 28175.54 },
    { year: "2023-24", PB: 24243, SD: 4359.97, KP: 1493.8, BL: 1486.1, PK: 31582.87 }
];

const RICE_DATA = [
    { year: "1947-48", PB: 249, SD: 382, KP: 6, BL: 45, PK: 682 },
    { year: "1948-49", PB: 311, SD: 374, KP: 10, BL: 41, PK: 736 },
    { year: "1949-50", PB: 342, SD: 398, KP: 11, BL: 41, PK: 792 },
    { year: "1950-51", PB: 307, SD: 490, KP: 9, BL: 45, PK: 851 },
    { year: "1951-52", PB: 285, SD: 385, KP: 11, BL: 38, PK: 719 },
    { year: "1952-53", PB: 302, SD: 469, KP: 8, BL: 40, PK: 819 },
    { year: "1953-54", PB: 370, SD: 472, KP: 7, BL: 57, PK: 906 },
    { year: "1954-55", PB: 282, SD: 483, KP: 10, BL: 50, PK: 825 },
    { year: "1955-56", PB: 275, SD: 499, KP: 11, BL: 43, PK: 828 },
    { year: "1956-57", PB: 313, SD: 452, KP: 11, BL: 55, PK: 831 },
    { year: "1957-58", PB: 303, SD: 483, KP: 12, BL: 64, PK: 862 },
    { year: "1958-59", PB: 404, SD: 508, KP: 14, BL: 50, PK: 976 },
    { year: "1959-60", PB: 410, SD: 520, KP: 14, BL: 35, PK: 979 },
    { year: "1960-61", PB: 499, SD: 469, KP: 12, BL: 34, PK: 1014 },
    { year: "1961-62", PB: 508, SD: 574, KP: 12, BL: 15, PK: 1109 },
    { year: "1962-63", PB: 521, SD: 514, KP: 12, BL: 31, PK: 1078 },
    { year: "1963-64", PB: 531, SD: 594, KP: 13, BL: 35, PK: 1173 },
    { year: "1964-65", PB: 649, SD: 629, KP: 14, BL: 37, PK: 1329 },
    { year: "1965-66", PB: 568, SD: 676, KP: 33, BL: 19, PK: 1296 },
    { year: "1966-67", PB: 618, SD: 651, KP: 34, BL: 40, PK: 1343 },
    { year: "1967-68", PB: 770, SD: 629, KP: 37, BL: 39, PK: 1475 },
    { year: "1968-69", PB: 1078, SD: 839, KP: 45, BL: 38, PK: 2000 },
    { year: "1969-70", PB: 1175, SD: 1097, KP: 49, BL: 42, PK: 2363 },
    { year: "1970-71", PB: 982.5, SD: 1122.7, KP: 66, BL: 28.5, PK: 2199.7 },
    { year: "1971-72", PB: 991.9, SD: 1168.1, KP: 59.3, BL: 42.6, PK: 2261.9 },
    { year: "1972-73", PB: 1000.9, SD: 1221.9, KP: 66, BL: 40.9, PK: 2329.7 },
    { year: "1973-74", PB: 1114.5, SD: 1235, KP: 72.2, BL: 33.4, PK: 2455.1 },
    { year: "1974-75", PB: 1152.4, SD: 1049, KP: 76.9, BL: 35.5, PK: 2313.8 },
    { year: "1975-76", PB: 1207.2, SD: 1286.1, KP: 84.6, BL: 39.6, PK: 2617.5 },
    { year: "1976-77", PB: 1332, SD: 1292, KP: 85.4, BL: 28, PK: 2737.4 },
    { year: "1977-78", PB: 1507.8, SD: 1315.3, KP: 87.6, BL: 38.9, PK: 2949.6 },
    { year: "1978-79", PB: 1765.9, SD: 1340.9, KP: 104, BL: 61.2, PK: 3272 },
    { year: "1979-80", PB: 1518.4, SD: 1499.1, KP: 104.7, BL: 93.6, PK: 3215.8 },
    { year: "1980-81", PB: 1361.7, SD: 1549.9, KP: 105.1, BL: 106.5, PK: 3123.2 },
    { year: "1981-82", PB: 1450.9, SD: 1584.2, KP: 110.7, BL: 283.9, PK: 3429.7 },
    { year: "1982-83", PB: 1407, SD: 1560.1, KP: 112.7, BL: 364.9, PK: 3444.7 },
    { year: "1983-84", PB: 1409.4, SD: 1478.8, KP: 115.8, BL: 335.5, PK: 3339.5 },
    { year: "1984-85", PB: 1534.9, SD: 1345, KP: 115.5, BL: 319.8, PK: 3315.2 },
    { year: "1985-86", PB: 1478.2, SD: 1071.7, KP: 113.8, BL: 255.2, PK: 2918.9 },
    { year: "1986-87", PB: 1534.8, SD: 1548.5, KP: 118.3, BL: 284.7, PK: 3486.3 },
    { year: "1987-88", PB: 1352.3, SD: 1537.5, KP: 107.5, BL: 243.6, PK: 3240.9 },
    { year: "1988-89", PB: 1367.3, SD: 1435.9, KP: 117.8, BL: 279.2, PK: 3200.2 },
    { year: "1989-90", PB: 1482.2, SD: 1340, KP: 114.6, BL: 283.3, PK: 3220.1 },
    { year: "1990-91", PB: 1422.3, SD: 1433.4, KP: 118, BL: 287.1, PK: 3260.8 },
    { year: "1991-92", PB: 1342.2, SD: 1487.5, KP: 123, BL: 290.4, PK: 3243.1 },
    { year: "1992-93", PB: 1403.9, SD: 1272.8, KP: 111.9, BL: 327.5, PK: 3116.1 },
    { year: "1993-94", PB: 1588.2, SD: 1954.9, KP: 118.4, BL: 333.2, PK: 3994.7 },
    { year: "1994-95", PB: 1684, SD: 1406.7, KP: 118.2, BL: 237.6, PK: 3446.5 },
    { year: "1995-96", PB: 1803, SD: 1697.2, KP: 118.2, BL: 348.1, PK: 3966.5 },
    { year: "1996-97", PB: 1864, SD: 1961.5, KP: 123.5, BL: 355.8, PK: 4304.8 },
    { year: "1997-98", PB: 1948, SD: 1840.9, KP: 130.2, BL: 413.9, PK: 4333 },
    { year: "1998-99", PB: 2176, SD: 1930.3, KP: 133.6, BL: 433.9, PK: 4673.8 },
    { year: "1999-00", PB: 2481, SD: 2123, KP: 129.2, BL: 422.4, PK: 5155.6 },
    { year: "2000-01", PB: 2577, SD: 1682.3, KP: 131.2, BL: 412.1, PK: 4802.6 },
    { year: "2001-02", PB: 2266, SD: 1159.1, KP: 121.7, BL: 335.2, PK: 3882 },
    { year: "2002-03", PB: 2579.7, SD: 1299.7, KP: 131.7, BL: 467.4, PK: 4478.5 },
    { year: "2003-04", PB: 2871.4, SD: 1432.8, KP: 130.8, BL: 412.6, PK: 4847.6 },
    { year: "2004-05", PB: 2980.3, SD: 1499.7, KP: 123.2, BL: 421.6, PK: 5024.8 },
    { year: "2005-06", PB: 3179.6, SD: 1721, KP: 117.5, BL: 529.1, PK: 5547.2 },
    { year: "2006-07", PB: 3075.53, SD: 1761.79, KP: 122.9, BL: 478.2, PK: 5438.42 },
    { year: "2007-08", PB: 3286, SD: 1817.7, KP: 128.3, BL: 331.4, PK: 5563.4 },
    { year: "2008-09", PB: 3643, SD: 2537.1, KP: 128.2, BL: 643.7, PK: 6952 },
    { year: "2009-10", PB: 3713, SD: 2422.3, KP: 102.4, BL: 645, PK: 6882.7 },
    { year: "2010-11", PB: 3384, SD: 1230.3, KP: 78.4, BL: 130.6, PK: 4823.3 },
    { year: "2011-12", PB: 3277, SD: 2260.1, KP: 94.7, BL: 528.6, PK: 6160.4 },
    { year: "2012-13", PB: 3478, SD: 1843.9, KP: 93.8, BL: 120.2, PK: 5535.9 },
    { year: "2013-14", PB: 2481, SD: 2617.3, KP: 111.9, BL: 587.9, PK: 5798.1 },
    { year: "2014-15", PB: 3648, SD: 2652.6, KP: 131, BL: 571.2, PK: 7002.8 },
    { year: "2015-16", PB: 3502.3, SD: 2572.8, KP: 153.8, BL: 572.7, PK: 6801.6 },
    { year: "2016-17", PB: 3475, SD: 2661.6, KP: 158.2, BL: 554.5, PK: 6849.3 },
    { year: "2017-18", PB: 3898, SD: 2850.5, KP: 147.5, BL: 553.8, PK: 7449.8 },
    { year: "2018-19", PB: 3979, SD: 2571.1, KP: 153.8, BL: 498.1, PK: 7202 },
    { year: "2019-20", PB: 4143.72, SD: 2374.3, KP: 152.9, BL: 535, PK: 7205.92 },
    { year: "2020-21", PB: 5301.4, SD: 2416.07, KP: 158.53, BL: 543.67, PK: 8419.67 },
    { year: "2021-22", PB: 5779, SD: 2861.38, KP: 157.55, BL: 524.75, PK: 9322.68 },
    { year: "2022-23", PB: 5070, SD: 2011.8, KP: 137.27, BL: 103.16, PK: 7322.23 },
    { year: "2023-24", PB: 6117, SD: 3074.1, KP: 151.5, BL: 526.63, PK: 9869.23 }
];

const COTTON_DATA = [
    { year: "1947-48", PB: 125.02, SD: 62.59, KP: 0.51, BL: 0, PK: 188.12 },
    { year: "1948-49", PB: 109.2, SD: 54.6, KP: 0.17, BL: 0, PK: 163.97 },
    { year: "1949-50", PB: 148.83, SD: 61.74, KP: 0.17, BL: 0, PK: 210.74 },
    { year: "1950-51", PB: 154.61, SD: 84.36, KP: 0.17, BL: 0, PK: 239.14 },
    { year: "1951-52", PB: 162.78, SD: 73.99, KP: 0.85, BL: 0, PK: 237.62 },
    { year: "1952-53", PB: 203.09, SD: 99.5, KP: 0.85, BL: 0, PK: 303.44 },
    { year: "1953-54", PB: 144.07, SD: 97.8, KP: 0.51, BL: 0, PK: 242.38 },
    { year: "1954-55", PB: 174.85, SD: 94.06, KP: 0.34, BL: 0, PK: 269.25 },
    { year: "1955-56", PB: 190.5, SD: 94.4, KP: 0.34, BL: 0, PK: 285.24 },
    { year: "1956-57", PB: 193.39, SD: 97.29, KP: 0.34, BL: 0, PK: 291.02 },
    { year: "1957-58", PB: 192.2, SD: 97.97, KP: 0.34, BL: 0, PK: 290.51 },
    { year: "1958-59", PB: 172.64, SD: 96.95, KP: 0.34, BL: 0, PK: 269.93 },
    { year: "1959-60", PB: 191.52, SD: 86.75, KP: 0.51, BL: 0, PK: 278.78 },
    { year: "1960-61", PB: 191.25, SD: 96.08, KP: 0.36, BL: 0, PK: 287.69 },
    { year: "1961-62", PB: 220.78, SD: 88.79, KP: 0.49, BL: 0, PK: 310.06 },
    { year: "1962-63", PB: 254.29, SD: 95.52, KP: 0.56, BL: 0, PK: 350.37 },
    { year: "1963-64", PB: 298.13, SD: 101.8, KP: 0.41, BL: 0, PK: 400.34 },
    { year: "1964-65", PB: 285.04, SD: 75.79, KP: 0.41, BL: 0, PK: 361.24 },
    { year: "1965-66", PB: 270.99, SD: 125.02, KP: 0.44, BL: 0, PK: 396.45 },
    { year: "1966-67", PB: 322.15, SD: 120.44, KP: 0.46, BL: 0, PK: 443.05 },
    { year: "1967-68", PB: 368.5, SD: 126, KP: 0.6, BL: 0, PK: 495.1 },
    { year: "1968-69", PB: 369.71, SD: 134.47, KP: 0.43, BL: 0, PK: 504.61 },
    { year: "1969-70", PB: 381.7, SD: 130.24, KP: 0.43, BL: 0, PK: 512.37 },
    { year: "1970-71", PB: 396.31, SD: 145.66, KP: 0.39, BL: 0.07, PK: 542.43 },
    { year: "1971-72", PB: 529.13, SD: 177.85, KP: 0.37, BL: 0.12, PK: 707.47 },
    { year: "1972-73", PB: 502.46, SD: 198.73, KP: 0.48, BL: 0.05, PK: 701.72 },
    { year: "1973-74", PB: 448.95, SD: 208.92, KP: 0.54, BL: 0.12, PK: 658.53 },
    { year: "1974-75", PB: 440.16, SD: 193.32, KP: 0.65, BL: 0.07, PK: 634.2 },
    { year: "1975-76", PB: 344.4, SD: 168.81, KP: 0.51, BL: 0.03, PK: 513.75 },
    { year: "1976-77", PB: 276.87, SD: 157.43, KP: 0.6, BL: 0.07, PK: 434.97 },
    { year: "1977-78", PB: 359.57, SD: 214.82, KP: 0.49, BL: 0.02, PK: 574.9 },
    { year: "1978-79", PB: 330.3, SD: 142.54, KP: 0.44, BL: 0.02, PK: 473.3 },
    { year: "1979-80", PB: 481.63, SD: 246.17, KP: 0.44, BL: 0.09, PK: 728.33 },
    { year: "1980-81", PB: 474.43, SD: 239.3, KP: 0.48, BL: 0.34, PK: 714.55 },
    { year: "1981-82", PB: 483.77, SD: 263.67, KP: 0.58, BL: 0.09, PK: 748.11 },
    { year: "1982-83", PB: 553.68, SD: 269.51, KP: 0.56, BL: 0.15, PK: 823.9 },
    { year: "1983-84", PB: 288.17, SD: 205.81, KP: 0.51, BL: 0.09, PK: 494.58 },
    { year: "1984-85", PB: 757.05, SD: 250.99, KP: 0.51, BL: 0.15, PK: 1008.7 },
    { year: "1985-86", PB: 969.72, SD: 246.49, KP: 0.49, BL: 0.2, PK: 1216.9 },
    { year: "1986-87", PB: 1097.25, SD: 221.9, KP: 0.48, BL: 0.22, PK: 1319.85 },
    { year: "1987-88", PB: 1234.07, SD: 233.65, KP: 0.46, BL: 0.19, PK: 1468.37 },
    { year: "1988-89", PB: 1237.37, SD: 188.46, KP: 0.31, BL: 0.09, PK: 1426.23 },
    { year: "1989-90", PB: 1267.89, SD: 187.68, KP: 0.29, BL: 0.09, PK: 1455.95 },
    { year: "1990-91", PB: 1445.99, SD: 191.28, KP: 0.22, BL: 0.09, PK: 1637.58 },
    { year: "1991-92", PB: 1941.88, SD: 238.67, KP: 0.29, BL: 0.09, PK: 2180.93 },
    { year: "1992-93", PB: 1401.05, SD: 138.71, KP: 0.12, BL: 0.09, PK: 1539.97 },
    { year: "1993-94", PB: 1109.5, SD: 258.03, KP: 0.07, BL: 0.12, PK: 1367.72 },
    { year: "1994-95", PB: 1260.37, SD: 218.07, KP: 0.07, BL: 0.78, PK: 1479.29 },
    { year: "1995-96", PB: 1483.19, SD: 316.62, KP: 0.05, BL: 2.23, PK: 1802.09 },
    { year: "1996-97", PB: 1208.22, SD: 382.74, KP: 0.1, BL: 3.4, PK: 1594.46 },
    { year: "1997-98", PB: 1159.5, SD: 397.24, KP: 0.14, BL: 5.19, PK: 1562.07 },
    { year: "1998-99", PB: 1127.36, SD: 362.99, KP: 0.14, BL: 4.66, PK: 1495.15 },
    { year: "1999-00", PB: 1497.47, SD: 404.37, KP: 0.1, BL: 9.86, PK: 1911.8 },
    { year: "2000-01", PB: 1452.57, SD: 364.18, KP: 0.07, BL: 8.57, PK: 1825.39 },
    { year: "2001-02", PB: 1368.54, SD: 415.56, KP: 0.7, BL: 20.29, PK: 1805.09 },
    { year: "2002-03", PB: 1303.57, SD: 410.22, KP: 0.78, BL: 22.15, PK: 1736.72 },
    { year: "2003-04", PB: 1310.03, SD: 381.48, KP: 0.85, BL: 16.65, PK: 1709.01 },
    { year: "2004-05", PB: 1896.33, SD: 513.11, KP: 0.88, BL: 16.04, PK: 2426.36 },
    { year: "2005-06", PB: 1746.48, SD: 450.4, KP: 0.88, BL: 16.62, PK: 2214.38 },
    { year: "2006-07", PB: 1760.43, SD: 407.91, KP: 0.1, BL: 18.27, PK: 2186.71 },
    { year: "2007-08", PB: 1541.36, SD: 431.38, KP: 0.09, BL: 9.59, PK: 1982.42 },
    { year: "2008-09", PB: 1488.46, SD: 506.58, KP: 0.09, BL: 15.17, PK: 2010.3 },
    { year: "2009-10", PB: 1454.61, SD: 726.4, KP: 0.02, BL: 15.43, PK: 2196.46 },
    { year: "2010-11", PB: 1335.89, SD: 601.57, KP: 0.07, BL: 11.72, PK: 1949.25 },
    { year: "2011-12", PB: 1892.93, SD: 400.87, KP: 0.12, BL: 18.45, PK: 2312.37 },
    { year: "2012-13", PB: 1620.28, SD: 578.37, KP: 0.12, BL: 17.62, PK: 2216.39 },
    { year: "2013-14", PB: 1555.47, SD: 599.29, KP: 0.14, BL: 16.96, PK: 2171.86 },
    { year: "2014-15", PB: 1748.02, SD: 607.65, KP: 0.51, BL: 18.22, PK: 2374.4 },
    { year: "2015-16", PB: 1078.88, SD: 591.16, KP: 0.2, BL: 16.6, PK: 1686.84 },
    { year: "2016-17", PB: 1186.89, SD: 611.8, KP: 0.1, BL: 16.18, PK: 1814.97 },
    { year: "2017-18", PB: 1373.82, SD: 642.23, KP: 0.09, BL: 15.7, PK: 2031.84 },
    { year: "2018-19", PB: 1161.03, SD: 499.79, KP: 0.09, BL: 16.31, PK: 1677.22 },
    { year: "2019-20", PB: 1072.6, SD: 467, KP: 0.1, BL: 16.3, PK: 1556 },
    { year: "2020-21", PB: 857.93, SD: 316.67, KP: 0.05, BL: 26.84, PK: 1201.49 },
    { year: "2021-22", PB: 879.03, SD: 510, KP: 0.09, BL: 27.54, PK: 1416.66 },
    { year: "2022-23", PB: 545.99, SD: 269.81, KP: 0.09, BL: 19.17, PK: 835.06 },
    { year: "2023-24", PB: 1025.32, SD: 659.89, KP: 0.02, BL: 53.53, PK: 1738.76 }
];

const seedHistoricalData = async () => {
    try {
        await connectDb();
        console.log("Connected to DB for historical seeding.");

        const crops = await CropType.find({}).lean();
        const provinces = await Province.find({}).lean();

        const findCrop = (code) => crops.find(c => c.code.toUpperCase() === code.toUpperCase());
        const findProvince = (code) => provinces.find(p => p.code === code);

        const wheatCrop = findCrop("WHEAT");
        const riceCrop = findCrop("RICE");
        const cottonCrop = findCrop("COTTON");

        if (!wheatCrop || !riceCrop || !cottonCrop) {
            console.error("Missing crop types in DB. Ensure 03-cropTypes.seed.js has been run.");
            process.exit(1);
        }

        const pb = findProvince("PB");
        const sd = findProvince("SD");
        const kp = findProvince("KP");
        const bl = findProvince("BL");

        const dataToInsert = [];

        const processData = (dataSet, cropType) => {
            dataSet.forEach(entry => {
                let year = entry.year;
                // Standardize year format from YYYY-YYYY or YYYY-YYY to YYYY-YY
                if (year.includes("-")) {
                    const parts = year.split("-");
                    if (parts[1].length > 2) {
                        year = `${parts[0]}-${parts[1].substring(parts[1].length - 2)}`;
                    }
                }

                const startYear = parseInt(year.split("-")[0]);
                const endYear = year.includes("-") ? (startYear + 1) : startYear;

                // Provincial Level
                const provMap = { PB: pb, SD: sd, KP: kp, BL: bl };
                Object.keys(provMap).forEach(code => {
                    if (entry[code] !== undefined) {
                        dataToInsert.push({
                            year,
                            cropYear: { startYear, endYear },
                            level: "provincial",
                            province: provMap[code]._id,
                            provinceCode: code,
                            cropType: cropType._id,
                            cropCode: cropType.code,
                            cropName: cropType.name,
                            areaCultivated: { value: 0, unit: "hectares" }, // No area in this dataset
                            production: { value: entry[code] * 1000, unit: "tonnes" },
                            yield: { value: 0, unit: "tonnes_per_hectare" },
                            dataSource: "Official_Historical_Records",
                            reliability: "high"
                        });
                    }
                });

                // National Level
                if (entry.PK !== undefined) {
                    dataToInsert.push({
                        year,
                        cropYear: { startYear, endYear },
                        level: "national",
                        cropType: cropType._id,
                        cropCode: cropType.code,
                        cropName: cropType.name,
                        areaCultivated: { value: 0, unit: "hectares" },
                        production: { value: entry.PK * 1000, unit: "tonnes" },
                        yield: { value: 0, unit: "tonnes_per_hectare" },
                        dataSource: "Official_Historical_Records",
                        reliability: "high"
                    });
                }
            });
        };

        processData(WHEAT_DATA, wheatCrop);
        processData(RICE_DATA, riceCrop);
        processData(COTTON_DATA, cottonCrop);

        console.log(`Prepared ${dataToInsert.length} historical records.`);

        // To avoid massive duplicates if re-run, we might want to delete existing historical ones or just trust it.
        // Given this is a seed script, it usually overwrites or adds.
        // Let's delete existing historical records first to allow clean reruns.
        await ProductionData.deleteMany({ dataSource: "Official_Historical_Records" });
        console.log("Cleared existing historical production records.");

        const inserted = await ProductionData.insertMany(dataToInsert);
        console.log(`✅ Successfully seeded ${inserted.length} historical records.`);

        await mongoose.disconnect();
        console.log("Disconnected from DB.");
        process.exit(0);
    } catch (error) {
        console.error("Seeding failed:", error);
        process.exit(1);
    }
};

seedHistoricalData();
