"""Tests for pagination logic."""

from src.scraper.paginator import PaginationState


def test_total_pages_exact_division():
    assert PaginationState(total=100, page_size=20).total_pages == 5


def test_total_pages_with_remainder():
    assert PaginationState(total=101, page_size=20).total_pages == 6


def test_total_pages_less_than_one_page():
    assert PaginationState(total=5, page_size=20).total_pages == 1


def test_total_pages_zero():
    assert PaginationState(total=0, page_size=20).total_pages == 0


def test_current_page_default():
    assert PaginationState(total=100, page_size=20).current_page == 1


def test_current_page_mid():
    assert PaginationState(total=100, page_size=20, current_start=40).current_page == 3


def test_params_for_page_first():
    p = PaginationState(total=100, page_size=20)
    assert p.params_for_page(1) == {"start": "0", "end": "20"}


def test_params_for_page_second():
    p = PaginationState(total=100, page_size=20)
    assert p.params_for_page(2) == {"start": "20", "end": "40"}


def test_params_for_page_last():
    p = PaginationState(total=100, page_size=20)
    assert p.params_for_page(5) == {"start": "80", "end": "100"}


def test_all_page_params_count():
    p = PaginationState(total=50, page_size=20)
    assert len(p.all_page_params()) == 3


def test_all_page_params_starts_are_sequential():
    p = PaginationState(total=60, page_size=20)
    starts = [int(params["start"]) for params in p.all_page_params()]
    assert starts == [0, 20, 40]


def test_all_page_params_empty_when_zero():
    assert PaginationState(total=0, page_size=20).all_page_params() == []
